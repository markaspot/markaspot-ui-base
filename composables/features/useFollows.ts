

import { ref, computed, onMounted } from 'vue'
import { useRequestsStore } from '~/stores/requests';

export interface FollowedReport {
  service_request_id: string;
  service_name: string;
  status: string;
  status_hex?: string;
  address_string?: string;
  followed_at: string;
  last_checked: string;
  last_known_status?: string;
  has_update?: boolean;
}

const followedReports = ref<FollowedReport[]>([]);
const POLLING_INTERVAL = 60000;
let pollingTimer: NodeJS.Timeout | null = null;


const loadFollowedReports = () => {
  if (process.client) {
    const stored = localStorage.getItem('followedReports');
    followedReports.value = stored ? JSON.parse(stored) : [];
  }
};


const updateFollowedReport = (updatedReport: any) => {
  const reportIndex = followedReports.value.findIndex(
    (r) => r.service_request_id === updatedReport.service_request_id
  );

  if (reportIndex !== -1) {
    
    followedReports.value[reportIndex] = {
      ...followedReports.value[reportIndex],
      status: updatedReport.status,
      status_hex: updatedReport.status_hex,
      has_update: updatedReport.status !== followedReports.value[reportIndex].last_known_status,
      last_known_status: updatedReport.status,
    };
    if (process.client) {
      localStorage.setItem('followedReports', JSON.stringify(followedReports.value));
    }
  }
};


const updatedReports = computed(() =>
  followedReports.value.filter((report) => report.has_update)
);


const updateCount = computed(() => updatedReports.value.length);


const isFollowing = (reportId: string): boolean => {
  return followedReports.value.some((r) => r.service_request_id === reportId);
};


const toggleFollow = (report: any): boolean => {
  const isCurrentlyFollowing = isFollowing(report.service_request_id);
  if (isCurrentlyFollowing) {
    followedReports.value = followedReports.value.filter(
      (r) => r.service_request_id !== report.service_request_id
    );
  } else {
    followedReports.value.push({
      service_request_id: report.service_request_id,
      service_name: report.service_name,
      status: report.status,
      last_known_status: report.status,
      status_hex: report.status_hex,
      address_string: report.address_string,
      last_checked: new Date().toISOString(),
      followed_at: new Date().toISOString(),
      has_update: false
    });
  }
  if (process.client) {
    localStorage.setItem('followedReports', JSON.stringify(followedReports.value));
  }
  return !isCurrentlyFollowing;
};



const markAsRead = (reportId: string) => {
  const reportIndex = followedReports.value.findIndex((r) => r.service_request_id === reportId);
  if (reportIndex !== -1) {
    followedReports.value[reportIndex] = {
      ...followedReports.value[reportIndex],
      has_update: false,
      last_known_status: followedReports.value[reportIndex].status,
    }

    if (process.client) {
      localStorage.setItem('followedReports', JSON.stringify(followedReports.value));
    }
  }
};


const markAllAsRead = () => {
  followedReports.value = followedReports.value.map((report) => ({
    ...report,
    has_update: false,
    last_known_status: report.status,
  }));

  if (process.client) {
    localStorage.setItem('followedReports', JSON.stringify(followedReports.value));
  }
};



const startPolling = () => {
  const requestsStore = useRequestsStore();
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  pollingTimer = setInterval(async () => {
    for (const report of followedReports.value) {
      try {
        const fetchedReport = await requestsStore.fetchRequestById(
          report.service_request_id
        );
        if (fetchedReport) {
          updateFollowedReport(fetchedReport);
        }
      } catch (error) {
        console.error(`Error fetching report ${report.service_request_id}:`, error);
      }
    }
  }, POLLING_INTERVAL);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};


export const useFollows = () => {
  loadFollowedReports(); 

  return {
    followedReports,
    updatedReports,
    updateCount,
    isFollowing,
    toggleFollow,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  };
};

