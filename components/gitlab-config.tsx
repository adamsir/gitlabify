"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GitLabConfigProps {
  onConfigSaved: (config: { token: string; groupId: string }) => void
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

    try {
      // Validate the token by making a test request to the GitLab API
      const response = await fetch(`https://gitlab.com/api/v4/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid access token. Please check your GitLab access token.")
        } else if (response.status === 404) {
          setError("Group not found. Please check your group ID.")
        } else {
          setError(`Error: ${response.status} - ${response.statusText}`)
        }
        return
      }

      onConfigSaved({ token, groupId })
    } catch (err) {
      setError("Failed to connect to GitLab API. Please check your network connection.")
    }
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
              type="password"
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
