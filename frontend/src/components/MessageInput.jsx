import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";


const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  
  const handleImageChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setFiles(filesArray); // store all selected files
    const file = filesArray[0]; // show preview of the first file only
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const MessageItem = ({ message }) => {
  const { text, imageName } = message; 
  // 'imageName' might be the random name from GCS, e.g. "abc123_post.jpg"

  // If using a private bucket, we link to our custom route:
  // const downloadUrl = `/download/${imageName}`;

  // If the bucket is public, we can link directly:
  // const downloadUrl = `https://storage.googleapis.com/timecapsule-memories/${imageName}`;

  // Decide which approach you prefer:
  const isBucketPrivate = false; // set to true if you want the server route
  const downloadUrl = isBucketPrivate
    ? `/download/${imageName}`
    : `https://storage.googleapis.com/timecapsule-memories/${imageName}`;

  return (
    <div className="message-item">
      {text && <p>{text}</p>}

      {imageName && (
        <div>
          {/* Show the image */}
          <img
            src={downloadUrl}
            alt="MessageImage"
            style={{ width: 100, height: "auto" }}
          />

          {/* Download link */}
          <a href={downloadUrl} download={imageName}>
            Download
          </a>
        </div>
      )}
    </div>
  );
};

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            multiple onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
  
};
export default MessageInput;


// import { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { Image, Send, X } from "lucide-react";
// import toast from "react-hot-toast";
// import { useState } from "react";
// import { useRef } from "react";
// // Minimal UUID generator (from your submit.js logic):
// function uuidv4() {
//   return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
//     (
//       c ^
//       (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
//     ).toString(16)
//   );
// }

// // Re-implementation of your "submit.js" logic for multiple images
// async function uploadImagesToServer(files) {
//   if (!files || files.length === 0) return;

//   const formData = new FormData();

//   for (let i = 0; i < files.length; i++) {
//     const file = files[i];
//     const postid = uuidv4();
//     let extension = "";
//     const dotIndex = file.name.lastIndexOf(".");
//     if (dotIndex > -1) {
//       extension = file.name.substring(dotIndex);
//     }

//     // Create a renamed file with the same MIME type
//     const blob = file.slice(0, file.size, file.type);
//     const newFile = new File([blob], `${postid}_post${extension}`, {
//       type: file.type,
//     });
//     formData.append("imgfile", newFile);
//   }

//   const res = await fetch("/upload", {
//     method: "POST",
//     body: formData,
//   });
//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(text || "Error uploading files.");
//   }
//   const data = await res.json();
//   console.log("Upload success:", data);
// }

// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const [imagePreview, setImagePreview] = useState(null);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const fileInputRef = useRef(null);
//   const { sendMessage } = useChatStore();

//   // Handle new image(s) selected
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files || []);
//     if (files.length === 0) return;

//     setSelectedFiles(files);

//     // For preview, show only the first image
//     const firstFile = files[0];
//     if (!firstFile.type.startsWith("image/")) {
//       toast.error("Please select image files only");
//       setSelectedFiles([]);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//       return;
//     }
//     // Create a preview for the first file
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result);
//     };
//     reader.readAsDataURL(firstFile);
//   };

//   // Remove image preview and reset file input
//   const removeImage = () => {
//     setImagePreview(null);
//     setSelectedFiles([]);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   // Send text message and/or upload selected images
//   const handleSendMessage = async (e) => {
//     e.preventDefault();

//     // If no text and no images, do nothing
//     if (!text.trim() && selectedFiles.length === 0) return;

//     try {
//       // 1. Upload images if any
//       if (selectedFiles.length > 0) {
//         await uploadImagesToServer(selectedFiles);
//         // Clear image states
//         setImagePreview(null);
//         setSelectedFiles([]);
//         if (fileInputRef.current) fileInputRef.current.value = "";
//       }

//       // 2. Send text message if we have text
//       if (text.trim()) {
//         await sendMessage({
//           text: text.trim(),
//           image: null, // We've already uploaded images
//         });
//       }

//       // Clear the text field
//       setText("");
//     } catch (error) {
//       console.error("Failed to send or upload:", error);
//       toast.error("Failed to send or upload. Please try again.");
//     }
//   };

//   return (
//     <div className="p-4 w-full">
//       {/* Preview the first image if we have one */}
//       {imagePreview && (
//         <div className="mb-3 flex items-center gap-2">
//           <div className="relative">
//             <img
//               src={imagePreview}
//               alt="Preview"
//               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
//             />
//             <button
//               onClick={removeImage}
//               className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
//               type="button"
//             >
//               <X size={14} />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Main form for text + image input */}
//       <form onSubmit={handleSendMessage} className="flex items-center gap-2">
//         <div className="flex-1 flex gap-2">
//           <input
//             type="text"
//             className="w-full input input-bordered rounded-lg input-sm sm:input-md"
//             placeholder="Type a message..."
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//           {/* Hidden file input for multiple images */}
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             className="hidden"
//             ref={fileInputRef}
//             onChange={handleImageChange}
//           />

//           <button
//             type="button"
//             className={`hidden sm:flex btn btn-circle ${
//               imagePreview ? "text-emerald-500" : "text-zinc-400"
//             }`}
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <Image size={20} />
//           </button>
//         </div>
//         <button
//           type="submit"
//           className="btn btn-sm btn-circle"
//           disabled={!text.trim() && selectedFiles.length === 0}
//         >
//           <Send size={20} />
//         </button>
//       </form>
//     </div>
//   );
// };

// export default MessageInput;
