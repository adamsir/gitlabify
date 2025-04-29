"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitlabConfig } from "@/types/gitlab"

interface GitLabConfigProps {
  onConfigSaved: (config: GitlabConfig) => void
}

export function GitLabConfig({ onConfigSaved }: GitLabConfigProps) {
  const [token, setToken] = useState("")
  const [groupId, setGroupId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token.trim() || !groupId.trim()) {
      setError("Both GitLab access token and group ID are required")
      return
    }

    onConfigSaved({ token, groupId });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>GitLab Configuration</CardTitle>
        <CardDescription>
          Enter your GitLab access token and group ID to fetch users from your GitLab group.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="token">GitLab Access Token</Label>
            <Input
              id="token"
              type="text"
              placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Create a personal access token with <code>read_api</code> scope in your GitLab settings.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupId">Group ID</Label>
            <Input id="groupId" placeholder="12345678" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
            <p className="text-sm text-muted-foreground">
              You can find your group ID in the group settings or in the URL.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Connect to GitLab</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
