import axios from "axios";
import { api } from "./constants";

// Scheduled Mails (backend: Scheduler/MailScheduler.js, mounted at /MailScheduler): the mails that are sent on their own every day.
const base = `${api}/MailScheduler`;

export const getScheduledMails = async () => (await axios.get(`${base}/list`)).data;
export const getScheduledMail = async (id) => (await axios.get(`${base}/${id}`)).data;
export const saveScheduledMail = async (id, body) => (await axios.post(`${base}/${id}/save`, body)).data;
// a dry run: who would be mailed (nothing is sent)
export const previewScheduledMail = async (id) => (await axios.post(`${base}/${id}/preview`, {})).data;
// sends it now, only to the test addresses
export const testScheduledMail = async (id, userId) => (await axios.post(`${base}/${id}/test`, { userId })).data;
// Run now with the saved mode (Live needs confirm = true)
export const runScheduledMail = async (id, userId, confirm) => (await axios.post(`${base}/${id}/run`, { userId, confirm })).data;

// the run log of a mail (latest runs) and one run with its suppliers
// one page of the runs: { runs, total, page, pageSize, pages }; problem = only the failed / partial runs
export const getScheduledMailRuns = async (id, { page = 1, pageSize = 10, problem = false } = {}) => (await axios.get(`${base}/${id}/runs`, { params: { page, pageSize, problem: problem ? 1 : 0 } })).data;
export const getScheduledMailRun = async (id, runId) => (await axios.get(`${base}/${id}/runs/${runId}`)).data;
