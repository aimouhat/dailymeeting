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
    throw error;
  }
};

export const saveReport = async (reportData: any) => {
  try {
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
    throw error;
  }
}; 