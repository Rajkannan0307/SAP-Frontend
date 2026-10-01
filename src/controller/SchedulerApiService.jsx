import axios from "axios";
import { api } from "./constants";

const base = `${api}/Scheduler`;

export const getSchedulerJobs = async () => (await axios.get(`${base}/jobs`)).data;
export const getSchedulerTargets = async () => (await axios.get(`${base}/targets`)).data;
export const getTargetColumns = async (table) => (await axios.get(`${base}/targets/${encodeURIComponent(table)}/columns`)).data;
export const saveSchedulerJob = async (body) => (await axios.post(`${base}/jobs/save`, body)).data;
export const deleteSchedulerJob = async (id) => (await axios.post(`${base}/jobs/${id}/delete`)).data;
export const getJobMapping = async (id) => (await axios.get(`${base}/jobs/${id}/mapping`)).data;
export const saveJobMapping = async (id, rows) => (await axios.post(`${base}/jobs/${id}/mapping`, { rows })).data;
export const previewJobFile = async (id) => (await axios.post(`${base}/jobs/${id}/preview`)).data;
export const getRetentionPreview = async (id, body) => (await axios.post(`${base}/jobs/${id}/retention-preview`, body)).data;
export const runSchedulerJob = async (id, userId) => (await axios.post(`${base}/jobs/${id}/run`, { userId })).data;
export const getSchedulerRuns = async (params) => (await axios.get(`${base}/runs`, { params })).data;
