"use client";

import { useState } from "react";
import { GitLabConfig } from "@/components/gitlab-config";
import { UsersList } from "@/components/users-list";

export default function Home() {
  const [showConfig, setShowConfig] = useState(true);
  const [config, setConfig] = useState<{
    token: string;
    groupId: string;
  } | null>(null);

  return (
    <main className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">GitLab API Explorer</h1>

      {showConfig ? (
        <GitLabConfig onConfigSaved={(config) => {
          setConfig(config)
          setShowConfig(false);
        }} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Group Users</h2>
            <button
              onClick={() => setShowConfig(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Change Configuration
            </button>
          </div>
          {config && (
            <UsersList token={config.token} groupId={config.groupId} />
          )}
        </div>
      )}
    </main>
  );
}
