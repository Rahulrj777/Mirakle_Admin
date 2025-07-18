export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "your_upload_preset"); // change this
  formData.append("cloud_name", "your_cloud_name"); // change this

  const res = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return {
    imageUrl: data.secure_url,
    public_id: data.public_id,
  };
};
