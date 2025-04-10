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
  const [userSchedule, setUserSchedule] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    building: "",
    room: "",
    days: "",
    startTime: "",
    endTime: ""
  });
  const [editingClass, setEditingClass] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    building: "",
    room: "",
    days: "",
    startTime: "",
    endTime: ""
  });

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    async function loadUserData() {
      try {
        // Fetch markers
        const { data: markers, error: markersError } = await supabase
          .from("markers")
          .select("*")
          .eq("user_id", user.id);
        if (markersError) throw markersError;
        setUserMarkers(markers || []);
        
        // Fetch schedule
        const { data: schedule, error: scheduleError } = await supabase
          .from("class_schedule")
          .select("*")
          .eq("user_id", user.id);
          
        if (scheduleError) throw scheduleError;
        setUserSchedule(schedule || []);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user, router]);

  const handleAddClass = async (e) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from("class_schedule")
        .insert([{
          user_id: user.id,
          class_name: newClass.name,
          building: newClass.building,
          room: newClass.room,
          days: newClass.days,
          start_time: newClass.startTime,
          end_time: newClass.endTime
        }])
        .select();
        
      if (error) throw error;
      
      setUserSchedule([...userSchedule, data[0]]);
      setShowAddForm(false);
      setNewClass({
        name: "",
        building: "",
        room: "",
        days: "",
        startTime: "",
        endTime: ""
      });
      
      // Refresh map markers
      window.dispatchEvent(new CustomEvent('classScheduleChanged'));
    } catch (error) {
      console.error("Error adding class:", error);
      alert("Failed to add class");
    }
  };
  
  const handleEditClass = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("class_schedule")
        .update({
          class_name: editForm.name,
          building: editForm.building,
          room: editForm.room,
          days: editForm.days,
          start_time: editForm.startTime,
          end_time: editForm.endTime
        })
        .eq("id", editingClass);
        
      if (error) throw error;
      
      // Update the local state with the edited class
      setUserSchedule(userSchedule.map(cls => 
        cls.id === editingClass 
          ? {
              ...cls,
              class_name: editForm.name,
              building: editForm.building,
              room: editForm.room,
              days: editForm.days,
              start_time: editForm.startTime,
              end_time: editForm.endTime
            } 
          : cls
      ));
      
      // Reset editing state
      setEditingClass(null);
      
      // Send event to refresh map markers
      window.dispatchEvent(new CustomEvent('classScheduleChanged'));
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Failed to update class");
    }
  };

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

          <div className="bg-white shadow rounded-lg p-6 mb-6">
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

          {/* Class Schedule Section */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                My Class Schedule ({userSchedule.length})
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {showAddForm ? "Cancel" : "Add Class"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddClass} className="mb-6 p-4 border rounded bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class Name/Number</label>
                    <input
                      type="text"
                      required
                      value={newClass.name}
                      onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                      placeholder="CS 101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Building</label>
                    <select
                      required
                      value={newClass.building}
                      onChange={(e) => setNewClass({...newClass, building: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    >
                      <option value="">Select Building</option>
                      <option value="SULB">SULB</option>
                      <option value="GYTE">GYTE</option>
                      <option value="CLO">CLO</option>
                      <option value="ANDERSON">ANDERSON</option>
                      <option value="POTTER">POTTER</option>
                      <option value="POWERS">POWERS</option>
                      <option value="NILS">NILS</option>
                      <option value="PORTER">PORTER</option>
                      <option value="OFFICE">OFFICE</option>
                      <option value="FITNESS">FITNESS</option>
                      <option value="COUNSELING">COUNSELING</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room</label>
                    <input
                      type="text"
                      required
                      value={newClass.room}
                      onChange={(e) => setNewClass({...newClass, room: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                      placeholder="140"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Days</label>
                    <input
                      type="text"
                      required
                      value={newClass.days}
                      onChange={(e) => setNewClass({...newClass, days: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                      placeholder="MWF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newClass.startTime}
                      onChange={(e) => setNewClass({...newClass, startTime: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="time"
                      required
                      value={newClass.endTime}
                      onChange={(e) => setNewClass({...newClass, endTime: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Class
                  </button>
                </div>
              </form>
            )}

            {userSchedule.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userSchedule.map((classItem) => (
                      <tr key={classItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{classItem.class_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{classItem.building} {classItem.room}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{classItem.days} {classItem.start_time}-{classItem.end_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // Set the current class data to edit form
                                setEditForm({
                                  name: classItem.class_name,
                                  building: classItem.building,
                                  room: classItem.room,
                                  days: classItem.days,
                                  startTime: classItem.start_time,
                                  endTime: classItem.end_time
                                });
                                setEditingClass(classItem.id);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("Delete this class?")) {
                                  try {
                                    console.log("Deleting class with ID:", classItem.id);
                                    
                                    const { error } = await supabase
                                      .from("class_schedule")
                                      .delete()
                                      .eq("id", classItem.id);
                                      
                                    if (error) throw error;
                                    
                                    setUserSchedule(
                                      userSchedule.filter((c) => c.id !== classItem.id)
                                    );
                                    
                                    // Refresh map markers
                                    window.dispatchEvent(new CustomEvent('classScheduleChanged'));
                                  } catch (error) {
                                    console.error("Error deleting class:", error);
                                    alert("Failed to delete class");
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No classes added to your schedule yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Class</h3>
            <form onSubmit={handleEditClass}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Name/Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Building</label>
                  <select
                    required
                    value={editForm.building}
                    onChange={(e) => setEditForm({...editForm, building: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  >
                    <option value="">Select Building</option>
                    <option value="SULB">SULB</option>
                    <option value="GYTE">GYTE</option>
                    <option value="CLO">CLO</option>
                    <option value="ANDERSON">ANDERSON</option>
                    <option value="POTTER">POTTER</option>
                    <option value="POWERS">POWERS</option>
                    <option value="NILS">NILS</option>
                    <option value="PORTER">PORTER</option>
                    <option value="OFFICE">OFFICE</option>
                    <option value="FITNESS">FITNESS</option>
                    <option value="COUNSELING">COUNSELING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input
                    type="text"
                    required
                    value={editForm.room}
                    onChange={(e) => setEditForm({...editForm, room: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Days</label>
                  <input
                    type="text"
                    required
                    value={editForm.days}
                    onChange={(e) => setEditForm({...editForm, days: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="time"
                      required
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="time"
                      required
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}