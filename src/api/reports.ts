<<<<<<< HEAD
import api from './http';

export const getHistoricalReports = async () => {
  try {
    const response = await api.get('/reports');
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
=======
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const getHistoricalReports = async () => {
  try {
    console.log('Fetching historical reports from:', `${API_URL}/reports`);
    const response = await axios.get(`${API_URL}/reports`);
    console.log('Received reports response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    throw error;
  }
};

export const saveReport = async (reportData: any) => {
  try {
<<<<<<< HEAD
    const response = await api.post('/reports', reportData);
    return response.data;
  } catch (error) {
    console.error('Error saving report:', error);
=======
    console.log('Saving report:', reportData.fileName);
    const response = await axios.post(`${API_URL}/reports`, reportData);
    console.log('Save report response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving report:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    throw error;
  }
}; 