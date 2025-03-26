"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userMarkers, setUserMarkers] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    async function loadUserData() {
      try {
        const { data: markers, error } = await supabase
          .from("markers")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;
        setUserMarkers(markers || []);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <p className="text-gray-600">Email: {user.email}</p>
            <p className="text-gray-600">
              Account created: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              My Markers ({userMarkers.length})
            </h2>
            {userMarkers.length > 0 ? (
              <div className="space-y-4">
                {userMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    className="border rounded p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{marker.description}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(marker.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this marker?")) {
                          await supabase
                            .from("markers")
                            .delete()
                            .eq("id", marker.id);
                          setUserMarkers(
                            userMarkers.filter((m) => m.id !== marker.id)
                          );
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No markers created yet</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
