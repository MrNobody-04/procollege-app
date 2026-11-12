import { useEffect, useState } from 'react';

export interface CollegeNotice {
  id: string;
  college_id: string;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent' | 'important';
  author_id?: string;
  author_name?: string;
  created_at: string;
}

export function useCollegeNotices(collegeId: string = 'padmashree-demo') {
  const [notices, setNotices] = useState<CollegeNotice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/notices/${encodeURIComponent(collegeId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (active && data.notices) {
          setNotices(data.notices);
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('[Notices] Fetch error:', err);
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [collegeId]);

  return { notices, loading, error };
}

