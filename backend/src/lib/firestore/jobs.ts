import { db, now } from './client';

export interface Job {
  id: string;
  role: string;
  dept: string;
  location: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

const col = () => db.collection('jobs');

export async function listJobs(activeOnly = true): Promise<Job[]> {
  let q = col() as FirebaseFirestore.Query;
  if (activeOnly) {
    q = q.where('isActive', '==', true);
  }
  const snap = await q.get();
  const jobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];

  // Sort in memory to avoid index requirements
  jobs.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  return jobs;
}

export async function createJob(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
  const ref = col().doc();
  const payload = {
    ...data,
    createdAt: now(),
    updatedAt: now(),
  };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as Job;
}

export async function updateJob(id: string, data: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await col().doc(id).update({
    ...data,
    updatedAt: now(),
  });
}

export async function deleteJob(id: string): Promise<void> {
  await col().doc(id).delete();
}
