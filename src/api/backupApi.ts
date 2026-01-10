import axiosInstance from "./axiosInstance";

export const backupApi = {
  /**
   * Export database backup
   */
  exportBackup: async () => {
    try {
      const response = await axiosInstance.get("/backup/export", {
        responseType: "blob",
      });

      // Get filename from header if possible, else default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `risk_backup_${new Date().toISOString().split("T")[0]}.db`;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
          contentDisposition
        );
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Failed to export backup:", error);
      throw error;
    }
  },

  /**
   * Import database backup
   */
  importBackup: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post("/backup/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to import backup:", error);
      throw error;
    }
  },
};