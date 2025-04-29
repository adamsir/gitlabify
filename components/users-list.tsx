"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { User } from "@/types/user";
import { UserDetail } from "./user-detail";
import { GitlabConfig } from "@/types/gitlab";
import { set } from "date-fns";
import { get } from "http";

type UsersListProps = GitlabConfig;

type Ownership = "owner" | "member";
interface Project {
  id: number;
  name: string;
  ownership: Ownership;
}

interface Group {
  id: string;
  name: string;
  path: string;
  web_url: string;
}

function getHeaders(token: GitlabConfig["token"]): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function getGroupMembers(groupId: string, token: string) {
  const headers = getHeaders(token);

  const res = await fetch(
    `https://gitlab.com/api/v4/groups/${groupId}/members`,
    {
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(`Error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

async function getGroupProjects(groupId: string, token: string) {
  const headers = getHeaders(token);

  const groupMembers = await fetch(
    `https://gitlab.com/api/v4/groups/${groupId}/projects`,
    {
      headers,
    }
  ).then((res) => res.json());

  return groupMembers;
}

async function getProjectMembers(projectId: string, token: string) {
  const headers = getHeaders(token);

  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/members`,
    {
      headers,
    }
  );

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

async function getUsers(groupId: string, token: string) {
  const headers = getHeaders(token);
  const res = await fetch(
    `https://gitlab.com/api/v4/groups/${groupId}/members/all`,
    {
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(`Error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}
async function getGroups(groupId: string, token: string) {
  const headers = getHeaders(token);
  const res = await fetch(`https://gitlab.com/api/v4/groups/`, {
    headers: {
      ...headers,
      id: groupId,
    },
  });

  if (!res.ok) {
    throw new Error(`Error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

async function fetchUsersGroupsAndProjects({
  token,
  groupId,
}: UsersListProps): Promise<GroupMembers[]> {
  const groups = await getGroups(groupId, token);
  if (!groups) {
    throw new Error("Failed to fetch data");
  }

  const results: GroupMembers[] = await Promise.all(
    groups.map(async (group: Group) => {
      const [groupMembers, groupProjects] = await Promise.all([
        getGroupMembers(group.id, token).then((members) =>
          members.map((member: User) => ({
            ...member,
            groupId: group.id,
            groupName: group.name,
            groupPath: group.path,
            groupWebUrl: group.web_url,
            ownership: member.access_level >= 50 ? "owner" : "member",
          }))
        ),
        getGroupProjects(group.id, token),
      ]);

      return {
        groupMembers,
        groupProjects,
      };
    })
  );

  return results;
}

type ParsedResult = {
  [userId: number]: {
    groups: {
      groupId: number;
      groupName: string;
      groupPath: string;
      groupWebUrl: string;
    }[];
    projects: any;
  };
};
type GroupMembers = {
  groupMembers: /* User[] */ any;
  groupProjects: any;
};

function parseGroups(data: GroupMembers[]): ParsedResult {
  const result: ParsedResult = {};

  data.forEach((group) => {
    const { groupMembers, groupProjects } = group;

    groupMembers.forEach((member) => {
      if (!result[member.id]) {
        result[member.id] = {
          groups: [],
          projects: [],
        };
      }

      result[member.id].groups.push({
        groupId: member.groupId,
        groupName: member.groupName,
        groupPath: member.groupPath,
        groupWebUrl: member.groupWebUrl,
        ownership: member.access_level >= 50 ? "owner" : "member",
      });

      result[member.id].projects.push(...groupProjects);
    });
  });

  return result;
}

export function UsersList({ token, groupId }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMisc, setLoadingMisc] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      console.log("Fetching users...");
      setLoadingUsers(true);
      setError(null);

      try {
        const usersData = await getUsers(groupId, token);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoadingUsers(false);
        setLoadingMisc(false);
      }
    };

    const fetchUsersMisc = async () => {
      console.log("Fetching miscs...");
      setLoadingMisc(true);
      setError(null);

      try {
        const usersGroupsAndProjects = await fetchUsersGroupsAndProjects({
          token,
          groupId,
        });

        setGroups(parseGroups(usersGroupsAndProjects));

        console.log(parseGroups(usersGroupsAndProjects));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch groups and projects"
        );
      } finally {
        setLoadingMisc(false);
      }
    };

    fetchUsers()
      .then(() => {
        fetchUsersMisc();
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to fetch everything"
        );
      });

    // unmount
    return () => {
      setUsers([]);
      setLoadingUsers(false);
      setLoadingMisc(false);
      setError(null);
    };
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAccessLevelName = (level: number) => {
    switch (level) {
      case 10:
        return "Guest";
      case 20:
        return "Reporter";
      case 30:
        return "Developer";
      case 40:
        return "Maintainer";
      case 50:
        return "Owner";
      default:
        return "Unknown";
    }
  };

  if (loadingUsers) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading users: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {users.length === 0
            ? "No users found in this group"
            : "No users match your search"}
        </p>
      ) : (
        filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {user.name}
                        <span className="pl-2 text-xs text-muted-foreground">
                          {user.username}
                        </span>
                      </h3>
                      <Badge variant="outline" className="-ml-0.5">
                        {getAccessLevelName(user.access_level)}
                      </Badge>
                      <div>
                        {loadingMisc ? (
                          <Skeleton className="h-8 w-32" />
                        ) : (
                          <div>
                            <div>{groups[user.id] &&
                              groups[user.id].groups.map((group) => (
                                <Badge
                                  key={user.id}
                                  variant="default"
                                  className="-ml-0.5"
                                >
                                  {group.groupName} | {group.ownership}
                                </Badge>
                              ))}</div>
                            {groups[user.id] &&
                              groups[user.id].projects.map((project) => (
                                <Badge
                                  key={user.id}
                                  variant="secondary"
                                  className="-ml-0.5"
                                >
                                  Namespace: {project.name_with_namespace}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserDetail id={user.id} token={token} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
