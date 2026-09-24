"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ReportImage({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.storage
        .from("report-images")
        .createSignedUrl(path, 300);
      if (active) setUrl(data?.signedUrl ?? null);
    }
    load();
    return () => { active = false; };
  }, [path]);

  return url ? <img src={url} alt={alt} className={className} /> : null;
}
