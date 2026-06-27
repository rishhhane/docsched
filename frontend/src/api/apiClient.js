import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const api = axios.create({
  baseURL: '', // base URL is empty because Vite proxy handles the routing
});

// --- API Functions ---

export const getDoctors = async () => {
  const { data } = await api.get('/api/doctors');
  return data;
};

export const addDoctor = async (doctorData) => {
  const { data } = await api.post('/api/doctors', doctorData);
  return data;
};

export const deleteDoctor = async (id) => {
  const { data } = await api.delete(`/api/doctors/${id}`);
  return data;
};

export const getLeaves = async () => {
  const { data } = await api.get('/api/leaves');
  return data;
};

export const saveLeaves = async (leaveData) => {
  const { data } = await api.post('/api/leaves', leaveData);
  return data;
};

export const getSchedule = async (month, year) => {
  const { data } = await api.get('/api/schedule', {
    params: { month, year }
  });
  return data;
};

export const generateSchedule = async ({ month, year }) => {
  const { data } = await api.post('/api/schedule/generate', { month, year });
  return data;
};

export const updateSchedule = async ({ id, doctor_1_id, doctor_2_id, doctor_3_id }) => {
  const { data } = await api.patch(`/api/schedule/${id}`, {
    doctor_1_id,
    doctor_2_id,
    doctor_3_id
  });
  return data;
};

// --- React Query Hooks ---

export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });
};

export const useAddDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

export const useLeaves = () => {
  return useQuery({
    queryKey: ['leaves'],
    queryFn: getLeaves,
  });
};

export const useSaveLeaves = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveLeaves,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

export const useSchedule = (month, year) => {
  return useQuery({
    queryKey: ['schedule', month, year],
    queryFn: () => getSchedule(month, year),
    enabled: !!month && !!year,
  });
};

export const useGenerateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateSchedule,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', data.month, data.year] });
    },
  });
};

export const useUpdateSchedule = (month, year) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', month, year] });
    },
  });
};
