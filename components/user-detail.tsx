"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDetail as User } from "@/types/user";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

type UserDetailProps = {
  id: User["id"];
  token: string;
};

export function UserDetail({ id, token }: UserDetailProps) {
  const [user, setUser] = useState<User>({} as User);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);

      try {
        const response = await fetch(`https://gitlab.com/api/v4/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to fetch user"
        );
      } finally {
        setLoading(false);
      }
    };

    dialogOpen && fetchUser();
  }, [id, token, dialogOpen]);

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

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        Show detail
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {loading ? (
            <>
              <Skeleton className="h-4 w-32" />
              <VisuallyHidden>
                <DialogTitle>User detail</DialogTitle>
              </VisuallyHidden>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{user.name}</DialogTitle>
                <DialogDescription>
                  <div className="">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>{user.name}</AvatarFallback>
                    </Avatar>
                    <div>
                      {user.web_url && (
                        <a href={user.web_url} target="_blank" rel="noreferrer">
                          <Button className="px-0" variant="link">
                            View Profile
                            <ExternalLink />
                          </Button>
                        </a>
                      )}
                    </div>
                    <Separator className="my-4" />
                    <div>
                      <div className="space-y-1">
                        <div className="text-sm font-black leading-none">
                          Job title
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.job_title || "N/A"}
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div>
                      <div className="space-y-1">
                        <div className="text-sm font-black leading-none">
                          Location
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.location || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
