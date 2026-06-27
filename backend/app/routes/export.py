from flask import Blueprint, send_file, request, jsonify
import io
import datetime
import calendar
from app.models import db, Schedule, Doctor, Leave
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

export_bp = Blueprint('export', __name__)


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#6b7280'))
    # Landscape page size is 792 x 612. Margin is 30.
    page_num = canvas.getPageNumber()
    canvas.drawString(30, 20, "MedScheduler Portal — Confidential")
    canvas.drawRightString(762, 20, f"Page {page_num}")
    canvas.restoreState()

@export_bp.route('/api/export/pdf', methods=['GET'])
def export_pdf():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not month or not year:
        now = datetime.datetime.now()
        month = month or now.month
        year = year or now.year
        
    start_date = datetime.date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = datetime.date(year, month, last_day)
    
    schedules = Schedule.query.filter(Schedule.date >= start_date, Schedule.date <= end_date).order_by(Schedule.date, Schedule.shift).all()
    doctors = Doctor.query.order_by(Doctor.priority, Doctor.name).all()
    leaves = Leave.query.filter(Leave.leave_date >= start_date, Leave.leave_date <= end_date).all()
    
    # Process stats
    leaves_by_doctor = {}
    for l in leaves:
        leaves_by_doctor.setdefault(l.doctor_id, []).append(l.leave_date.strftime("%d"))
        
    stats = {
        doc.id: {
            'name': doc.name,
            'priority': doc.priority,
            'morning': 0,
            'evening': 0,
            'total': 0,
            'leaves': sorted(leaves_by_doctor.get(doc.id, []), key=int)
        }
        for doc in doctors
    }
    
    for s in schedules:
        for doc_id, shift_type in [(s.doctor_1_id, s.shift), (s.doctor_2_id, s.shift), (s.doctor_3_id, s.shift)]:
            if doc_id and doc_id in stats:
                stats[doc_id]['total'] += 1
                if shift_type == 'morning':
                    stats[doc_id]['morning'] += 1
                elif shift_type == 'evening':
                    stats[doc_id]['evening'] += 1

    # Group schedules by date
    schedules_by_date = {}
    for s in schedules:
        schedules_by_date.setdefault(s.date, {})[s.shift] = s

    # PDF construction in Landscape mode
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=25, leftMargin=25, topMargin=25, bottomMargin=25
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=5
    )
    section_style = ParagraphStyle(
        'DocSection',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=5
    )
    
    story = []
    
    # Title
    month_name = calendar.month_name[month]
    story.append(Paragraph(f"Doctor Schedule Management Portal — {month_name} {year}", title_style))
    story.append(Spacer(1, 5))
    
    # 1. Main Unified Schedule Table (Side-by-Side Shifts)
    # Row 0: Spanned headers for Morning and Evening
    # Row 1: Sub-headers for Priority slots
    table_data = [
        ["Date", "Day", "Morning Shift (08:30 - 20:30)", "", "", "Evening Shift (20:30 - 08:30)", "", ""],
        ["", "", "Slot 1", "Slot 2", "Slot 3", "Slot 1", "Slot 2", "Slot 3"]
    ]
    
    # Add each calendar day's assignments
    current_day = start_date
    row_idx = 2
    sunday_rows = []
    while current_day <= end_date:
        if current_day.weekday() == 6:  # Sunday
            sunday_rows.append(row_idx)
            
        day_str = current_day.strftime("%d")
        day_name = current_day.strftime("%a")
        
        day_shifts = schedules_by_date.get(current_day, {})
        m_shift = day_shifts.get('morning')
        e_shift = day_shifts.get('evening')
        
        m_doc1 = m_shift.doctor_1.name if (m_shift and m_shift.doctor_1) else "None"
        m_doc2 = m_shift.doctor_2.name if (m_shift and m_shift.doctor_2) else "None"
        m_doc3 = m_shift.doctor_3.name if (m_shift and m_shift.doctor_3) else "None"
        
        e_doc1 = e_shift.doctor_1.name if (e_shift and e_shift.doctor_1) else "None"
        e_doc2 = e_shift.doctor_2.name if (e_shift and e_shift.doctor_2) else "None"
        e_doc3 = e_shift.doctor_3.name if (e_shift and e_shift.doctor_3) else "None"
        
        table_data.append([
            day_str,
            day_name,
            m_doc1,
            m_doc2,
            m_doc3,
            e_doc1,
            e_doc2,
            e_doc3
        ])
        row_idx += 1
        current_day += datetime.timedelta(days=1)

    # Calculate maximum font size for Page 1 table to fit in 530 points
    num_data_rows = last_day
    fs_page1 = (530 - 12 - 4 * num_data_rows) / (num_data_rows + 2)
    fs_page1 = int(fs_page1 * 2) / 2.0
    fs_page1 = min(fs_page1, 12.0)

    header_height = fs_page1 + 6.0
    row_height = fs_page1 + 4.0
    row_heights = [header_height, header_height] + [row_height] * (len(table_data) - 2)
        
    t_style = [
        ('SPAN', (0,0), (0,1)), # Span Date header
        ('SPAN', (1,0), (1,1)), # Span Day header
        ('SPAN', (2,0), (4,0)), # Span Morning Shift header
        ('SPAN', (5,0), (7,0)), # Span Evening Shift header
        
        ('BACKGROUND', (0,0), (1,1), colors.HexColor('#f1f5f9')), # light gray header corner
        ('BACKGROUND', (2,0), (4,0), colors.HexColor('#e2e8f0')), # Morning Header (slate-200)
        ('BACKGROUND', (5,0), (7,0), colors.HexColor('#cbd5e1')), # Evening Header (slate-300)
        ('BACKGROUND', (2,1), (4,1), colors.HexColor('#f8fafc')), # Morning Subheaders (slate-50)
        ('BACKGROUND', (5,1), (7,1), colors.HexColor('#f1f5f9')), # Evening Subheaders (slate-100)
        
        ('TEXTCOLOR', (0,0), (-1,1), colors.HexColor('#1f2937')), # dark text for headers
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), fs_page1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.0),
        ('TOPPADDING', (0,0), (-1,-1), 2.0),
    ]
    
    # Alternating data row backgrounds (clean light slate/white look)
    for r in range(2, len(table_data)):
        if r % 2 == 0:
            t_style.append(('BACKGROUND', (0, r), (-1, r), colors.HexColor('#f8fafc')))
            
    # Bold Sunday rows
    for r in sunday_rows:
        t_style.append(('FONTNAME', (0, r), (-1, r), 'Helvetica-Bold'))
                
    # colWidths total = 35*2 + 110*6 = 70 + 660 = 730 points. Page width is 792. Printable area is 732.
    t_schedule = Table(table_data, colWidths=[35, 35, 110, 110, 110, 110, 110, 110], rowHeights=row_heights)
    t_schedule.setStyle(TableStyle(t_style))
    story.append(t_schedule)
    
    # 2. Page Break for Stats and Rankings
    story.append(PageBreak())
    
    # Page 2 Title
    story.append(Paragraph("Doctor Workload Statistics & Equity Report", title_style))
    story.append(Spacer(1, 10))
    
    # Workload Stats Table data (340 points wide)
    stats_data = [["Doctor Name", "Prio", "Morn", "Eve", "Total"]]
    for doc_id, item in stats.items():
        stats_data.append([
            item['name'],
            f"P{item['priority']}",
            str(item['morning']),
            str(item['evening']),
            str(item['total'])
        ])
    # Calculate maximum font size for Page 2 tables to fit in 530 points
    num_doctors = len(doctors)
    if num_doctors > 0:
        fs_page2 = (530 - 6 - 4 * num_doctors) / (num_doctors + 1)
        fs_page2 = int(fs_page2 * 2) / 2.0
        fs_page2 = min(fs_page2, 12.0)
    else:
        fs_page2 = 12.0

    stats_header_height = fs_page2 + 6.0
    stats_row_height = fs_page2 + 4.0
    stats_row_heights = [stats_header_height] + [stats_row_height] * (len(stats_data) - 1)

    stats_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#475569')), # slate-600
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,1), (0,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), fs_page2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.0),
        ('TOPPADDING', (0,0), (-1,-1), 2.0),
    ]
    
    # Alternating row colors for stats table
    for row_idx in range(1, len(stats_data)):
        if row_idx % 2 == 0:
            stats_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#f8fafc')))
            
    t_stats = Table(stats_data, colWidths=[120, 40, 60, 60, 60], rowHeights=stats_row_heights)
    t_stats.setStyle(TableStyle(stats_style))
    
    leaves_style = ParagraphStyle(
        'LeavesStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=fs_page2,
        leading=fs_page2 + 2.0,
        alignment=1,  # Center alignment
        textColor=colors.HexColor('#1f2937')
    )
    
    # Rankings and Leaves Table data (340 points wide)
    ranked_stats = sorted(stats.values(), key=lambda x: (x['total'], x['evening'], x['name']))
    rankings_data = [["Rank", "Doctor Name", "Leave Dates", "Equity Status"]]
    
    for i, item in enumerate(ranked_stats):
        avg_shifts = sum(x['total'] for x in ranked_stats) / len(ranked_stats) if ranked_stats else 0
        diff = item['total'] - avg_shifts
        if diff > 3:
            status = "Overworked"
        elif diff < -3:
            status = "Underutilized"
        else:
            status = "Balanced"
            
        leaves_str = ", ".join(item['leaves']) if item['leaves'] else "None"
        rankings_data.append([
            str(i+1),
            item['name'],
            Paragraph(leaves_str, leaves_style),
            status
        ])
        
    rankings_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#475569')), # slate-600
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (1,1), (1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), fs_page2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.0),
        ('TOPPADDING', (0,0), (-1,-1), 2.0),
    ]
    
    # Alternating row colors for rankings table
    for row_idx in range(1, len(rankings_data)):
        if row_idx % 2 == 0:
            rankings_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#f8fafc')))
            
    t_rankings = Table(rankings_data, colWidths=[40, 110, 110, 80])
    t_rankings.setStyle(TableStyle(rankings_style))
    
    # Place Workload Stats and Rankings side-by-side using an outer Table wrapper
    # Total width: 340 + 50 (gap) + 340 = 730 points
    stats_and_rankings_table = Table([[t_stats, Spacer(1, 1), t_rankings]], colWidths=[340, 50, 340])
    stats_and_rankings_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    story.append(stats_and_rankings_table)
    
    # Build PDF and register footer template
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    buffer.seek(0)
    
    filename = f"schedule_{year}_{month:02d}.pdf"
    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )
