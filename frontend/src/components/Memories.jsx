// import { Link } from "react-router-dom";
// import { useAuthStore } from "../store/useAuthStore";
// import { LogOut, MessageSquare, Settings, User } from "lucide-react";
// import { useState } from "react";
// import { useDropzone } from "react-dropzone";
// import dayjs from "dayjs";
// import { v4 as uuidv4 } from "uuid";
// import axios from "axios";
// import React,{useEffect} from "react";
// import { axiosInstance } from "../lib/axios.js";
// const Navbar = () => {
//   const { logout, authUser } = useAuthStore();

//   const Memories = () => {
//     // const { authUser } = useAuthStore();
//     const [memories, setMemories] = useState([]);
//     const [isUploading, setIsUploading] = useState(false);
//     const onDrop = async (acceptedFiles) => {
//       setIsUploading(true);
//       try {
//         // For each file, get signed URL and upload
//         const uploadedMemories = await Promise.all(
//           acceptedFiles.map(async (file) => {
//             // 1) Request a signed URL from your backend
//             const { data } = await axiosInstance.get("/memories/get-signed-url", {
//               params: {
//                 fileName: file.name,
//                 fileType: file.type,
//               },
//             });
  
//             // 2) Use the returned "data.url" to PUT the file
//             const putResponse = await fetch(data.url, {
//               method: "PUT",
//               headers: { "Content-Type": file.type },
//               body: file,
//             });
//             if (!putResponse.ok) {
//               throw new Error(`Upload failed: ${putResponse.statusText}`);
//             }
  
//             // 3) Construct a local memory object
//             return {
//               id: uuidv4(),
//               src: data.publicUrl, // the read URL from backend
//               name: file.name,
//               date: dayjs().format("MMMM D, YYYY h:mm A"),
//               type: file.type.startsWith("video") ? "video" : "image",
//             };
//           })
//         );
  
//         // Option A) Just add them to local state now:
//         setMemories((prev) => [...prev, ...uploadedMemories]);
  
//         // Option B) Or, re-fetch from server to confirm
//         // await loadMemories();
//       } catch (error) {
//         console.error("Upload failed:", error);
//         alert(`Upload failed: ${error.message}`);
//       } finally {
//         setIsUploading(false);
//       }
//     };
  

//     const { getRootProps, getInputProps } = useDropzone({
//       accept: {
//         "image/*": [],
//         "video/*": [],
//       },
//       onDrop,
//     });

//     //To load memories
   
//     //  console.log("authUser",authUser);
 
    
//     const loadMemories = async () => {
//       try {
//         const { data } = await axiosInstance.get("/memories");
//         // data is an array of { id, name, src, timeCreated, contentType, ... }
//         // You might adapt it to your local structure
//         const mapped = data.map((item) => ({
//           id: item.id,
//           src: item.src,
//           name: item.name,
//           type: item.contentType?.startsWith("video") ? "video" : "image",
//           date: dayjs(item.timeCreated).format("MMMM D, YYYY h:mm A"),
//         }));
//         setMemories(mapped);
//       } catch (error) {
//         console.error("Failed to load memories:", error);
//       }
//     };
  
//     useEffect(() => {
//       loadMemories();
//     }, []);



//     return (
//       <div className="container mx-auto p-4">
//         <h1 className="text-3xl font-bold mb-6 text-center">Memories</h1>

//         {/* Upload Section */}
//         <div
//           {...getRootProps()}
//           className="border-4 border-dashed border-gray-300 p-8 rounded-lg cursor-pointer hover:bg-gray-100 transition text-center"
//         >
//           <input {...getInputProps()} />
//           <p className="text-gray-500 text-lg">Drag & drop your images or videos </p>
//         </div>

//         {/* Display Memories */}
//         <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {memories.map((memory) => (
//             <div
//               key={memory.id}
//               className="relative shadow-lg rounded-lg overflow-hidden group bg-gray-50"
//             >
//               {memory.type === "image" ? (
//                 <img
//                   src={memory.src}
//                   alt="memory"
//                   className="w-full h-48 object-cover transition-transform transform group-hover:scale-105"
//                 />
//               ) : (
//                 <video className="w-full h-48" controls>
//                   <source src={memory.src} type="video/mp4" />
//                   Your browser does not support the video tag.
//                 </video>
//               )}

//               {/* Hover Effects */}
//               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
//                 <div className="absolute top-2 right-2 flex gap-2">
//                   {/* Download Button */}
//                   <button
//                     onClick={() => {
//                       const link = document.createElement("a");
//                       link.href = memory.src;
//                       link.download = memory.name;
//                       link.click();
//                     }}
//                     className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition"
//                   >
//                     <span className="material-icons text-white">download</span>
//                   </button>
//                   {/* Share Button */}
//                   <button
//                     onClick={() =>
//                       navigator.share &&
//                       navigator.share({
//                         title: "Memory",
//                         text: "Check out this memory!",
//                         url: memory.src,
//                       })
//                     }
//                     className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition"
//                   >
//                     <span className="material-icons text-white">share</span>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <header
//       className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
//     backdrop-blur-lg bg-base-100/80"
//     >
//       <div className="container mx-auto px-4 h-16">
//         <div className="flex items-center justify-between h-full">
//           <div className="flex items-center gap-8">
//             <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
//               <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <MessageSquare className="w-5 h-5 text-primary" />
//               </div>
//               <h1 className="text-lg font-bold">TimeCapsule</h1>
//             </Link>

//             {/* New Memories Tab */}
//             <Link to="/memories" className="hover:opacity-80 transition-all text-lg font-bold">
//               Memories
//             </Link>
//           </div>

//           <div className="flex items-center gap-2">
//             <Link
//               to={"/settings"}
//               className={`
//               btn btn-sm gap-2 transition-colors
//               `}
//             >
//               <Settings className="w-4 h-4" />
//               <span className="hidden sm:inline">Settings</span>
//             </Link>

//             {authUser && (
//               <>
//                 <Link to={"/profile"} className={`btn btn-sm gap-2`}>
//                   <User className="size-5" />
//                   <span className="hidden sm:inline">Profile</span>
//                 </Link>

//                 <button className="flex gap-2 items-center" onClick={logout}>
//                   <LogOut className="size-5" />
//                   <span className="hidden sm:inline">Logout</span>
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Memories Component */}
//       <Memories />
//     </header>
//   );
// };

// export default Navbar;


import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { axiosInstance } from "../lib/axios.js";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  const Memories = () => {
    const [memories, setMemories] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // =========================================
    // 1) Handle File Drop and Upload
    // =========================================
    const onDrop = async (acceptedFiles) => {
      setIsUploading(true);
      try {
        // For each file, get a signed URL and upload to GCS
        const uploadedMemories = await Promise.all(
          acceptedFiles.map(async (file) => {
            // 1) Request a signed URL + objectPath from your backend
            const { data } = await axiosInstance.get("/memories/get-signed-url", {
              params: {
                fileName: file.name,
                fileType: file.type,
              },
            });
            // data = { url, publicUrl, objectPath }

            // 2) Upload the file to that signed URL
            const putResponse = await fetch(data.url, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });
            if (!putResponse.ok) {
              throw new Error(`Upload failed: ${putResponse.statusText}`);
            }

            // 3) Store the real GCS path (data.objectPath) as `id`
            //    so we can delete it immediately if needed
            return {
              id: data.objectPath, // <--- Use objectPath instead of uuidv4()
              src: data.publicUrl, // The read URL from backend
              name: file.name,
              date: dayjs().format("MMMM D, YYYY h:mm A"),
              type: file.type.startsWith("video") ? "video" : "image",
            };
          })
        );

        // Option A) Just add them to local state now
        setMemories((prev) => [...prev, ...uploadedMemories]);

        // Option B) Or re-fetch from server to confirm
        // await loadMemories();
      } catch (error) {
        console.error("Upload failed:", error);
        alert(`Upload failed: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    };

    // =========================================
    // 2) Setup React Dropzone
    // =========================================
    const { getRootProps, getInputProps } = useDropzone({
      accept: {
        "image/*": [],
        "video/*": [],
      },
      onDrop,
    });

    // =========================================
    // 3) Load Memories (fetch from server)
    // =========================================
    const loadMemories = async () => {
      try {
        const { data } = await axiosInstance.get("/memories");
        // data is an array of { id, name, src, timeCreated, contentType, ... }
        // Adapt it to your local structure
        const mapped = data.map((item) => ({
          id: item.id, // This includes the GCS object path, e.g. "memories/<userId>/..."
          src: item.src,
          name: item.name,
          type: item.contentType?.startsWith("video") ? "video" : "image",
          date: dayjs(item.timeCreated).format("MMMM D, YYYY h:mm A"),
        }));
        setMemories(mapped);
      } catch (error) {
        console.error("Failed to load memories:", error);
      }
    };

    useEffect(() => {
      loadMemories();
    }, []);

    // =========================================
    // 4) Delete Memory
    // =========================================
    const handleDelete = async (memory) => {
      try {
        // memory.id should be the GCS path (e.g. "memories/<userId>/...")
        // const encodedPath = encodeURIComponent(memory.id);
        await axiosInstance.delete("/memories", {
          params: { objectPath: memory.id },
        });
        // After deletion, reload or remove locally
        await loadMemories(); 
        // Or remove from state if you prefer:
        // setMemories((prev) => prev.filter((m) => m.id !== memory.id));
      } catch (error) {
        console.error("Failed to delete memory:", error);
        alert("Failed to delete memory. Please try again.");
      }
    };

    // =========================================
    // 5) Render
    // =========================================
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Memories</h1>

        {/* Upload Section */}
        <div
          {...getRootProps()}
          className="border-4 border-dashed border-gray-300 p-8 rounded-lg cursor-pointer hover:bg-gray-100 transition text-center"
        >
          <input {...getInputProps()} />
          <p className="text-gray-500 text-lg">Drag & drop your images or videos</p>
          {isUploading && <p className="mt-2 text-blue-500">Uploading...</p>}
        </div>

        {/* Display Memories */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="relative shadow-lg rounded-lg overflow-hidden group bg-gray-50"
            >
              {memory.type === "image" ? (
                <img
                  src={memory.src}
                  alt="memory"
                  className="w-full h-48 object-cover transition-transform transform group-hover:scale-105"
                />
              ) : (
                <video className="w-full h-48" controls>
                  <source src={memory.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                {/* Hover Buttons (Download + Delete) */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {/* Download Button */}
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = memory.src;
                      link.download = memory.name;
                      link.click();
                    }}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition"
                  >
                    <span className="material-icons text-white">download</span>
                  </button>

                  {/* Delete Button (replaces Share) */}
                  <button
                    onClick={() => handleDelete(memory)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  >
                    <span className="material-icons text-white">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">TimeCapsule</h1>
            </Link>

            {/* Memories Tab */}
            <Link to="/memories" className="hover:opacity-80 transition-all text-lg font-bold">
              Memories
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Memories Component */}
      <Memories />
    </header>
  );
};

export default Navbar;
