import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UploadedFile, InsertUploadedFile, insertUploadedFileSchema } from "@shared/schema";
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Archive, 
  X, 
  Check,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Share2,
  Copy
} from "lucide-react";

// Extend the base schema to handle tags as string for form input
const uploadFormSchema = insertUploadedFileSchema.extend({
  tags: z.string().optional(), // Form input as comma-separated string
}).omit({
  userId: true, // Will be set by backend
  lastAccessedAt: true,
  downloadCount: true,
  isActive: true,
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

// File type icon mapping
const getFileIcon = (mimeType: string, size: number = 20) => {
  if (mimeType.startsWith("image/")) return <Image size={size} />;
  if (mimeType.startsWith("video/")) return <Video size={size} />;
  if (mimeType.startsWith("audio/")) return <Music size={size} />;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return <FileText size={size} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return <Archive size={size} />;
  return <File size={size} />;
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// File upload dialog component
export function FileUploadDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      fileName: "",
      description: "",
      category: "general_upload",
      visibility: "private",
      tags: "",
      fileSize: 0,
      mimeType: "",
      objectPath: "",
    },
  });

  // Get upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: (data: { category: string; fileName: string }) =>
      apiRequest("/api/objects/upload", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  // Create file record mutation
  const createFileRecordMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/files", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Upload successful!",
        description: "Your file has been uploaded and saved.",
      });
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to save file metadata",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsDragOver(false);
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragOver to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // Only handle the first file
      handleFileSelection(file);
    }
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    // Auto-fill fileName with the actual filename
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    form.setValue("fileName", file.name);
    form.setValue("fileSize", file.size);
    form.setValue("mimeType", file.type);

    // Auto-select category based on file type
    if (file.type.startsWith("image/")) {
      form.setValue("category", "media");
    } else if (file.type.includes("pdf") || file.name.toLowerCase().includes("receipt")) {
      form.setValue("category", file.name.toLowerCase().includes("receipt") ? "receipt" : "document");
    }
  }, [form, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileSelection(file);
  };

  const uploadFile = async (file: File, uploadURL: string) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get presigned upload URL
      const uploadResponse = await getUploadUrlMutation.mutateAsync({
        category: data.category || "general_upload",
        fileName: selectedFile.name,
      });

      // Upload file to object storage
      await uploadFile(selectedFile, uploadResponse.uploadURL);

      // Create file record in database
      const tags = data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [];
      
      await createFileRecordMutation.mutateAsync({
        fileName: data.fileName || selectedFile.name,
        description: data.description,
        objectPath: uploadResponse.objectPath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        category: data.category,
        visibility: data.visibility,
        tags,
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload files with privacy controls. Files are organized by category and user role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                  }`}
                  data-testid="file-upload-area"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="flex items-center space-x-3">
                      {getFileIcon(selectedFile.type, 24)}
                      <div className="text-sm">
                        <p className="font-medium" data-testid="selected-file-name">{selectedFile.name}</p>
                        <p className="text-gray-500" data-testid="selected-file-size">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className={`text-sm transition-colors ${
                        isDragOver 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        <span className="font-semibold">{isDragOver ? "Drop file here" : "Click to upload"}</span> {isDragOver ? "" : "or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Max file size: 50MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid="input-file"
                  />
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                {/* File Details Form */}
                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="File name will be auto-filled" 
                          {...field} 
                          data-testid="input-filename"
                          readOnly
                        />
                      </FormControl>
                      <FormDescription>The original filename</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter file description" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormDescription>Additional details about the file</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general_upload">General Upload</SelectItem>
                            <SelectItem value="tournament_poster">Tournament Poster</SelectItem>
                            <SelectItem value="receipt">Receipt/Payment</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="media">Media/Photo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How this file will be organized</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Privacy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-visibility">
                              <SelectValue placeholder="Select privacy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private">Private (Only Me)</SelectItem>
                            <SelectItem value="hall_only">Hall Members</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Who can access this file</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="tournament, 9ball, championship (comma separated)" 
                          {...field} 
                          data-testid="input-tags"
                        />
                      </FormControl>
                      <FormDescription>Tags to help organize and find your files</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} data-testid="upload-progress" />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
                disabled={isUploading}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || isUploading}
                data-testid="button-upload"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// File management component
export function FileManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const { toast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch user files - fix query key by removing unnecessary undefined segments
  const { data: filesData, isLoading } = useQuery({
    queryKey: selectedCategory !== "all" 
      ? ["/api/files", "category", selectedCategory]
      : ["/api/files"],
    queryFn: () => {
      const url = selectedCategory !== "all" 
        ? `/api/files?category=${selectedCategory}`
        : "/api/files";
      return apiRequest(url);
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) =>
      apiRequest(`/api/files/${fileId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "File has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const toObjectRoutePath = (objectPath: string) => {
    if (!objectPath) return "/objects";
    const normalized = objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
    if (normalized.startsWith("/objects/")) return normalized;
    return `/objects/${normalized.replace(/^\/+/, "")}`;
  };

  const toPublicObjectRoutePath = (objectPath: string) => {
    const privatePath = toObjectRoutePath(objectPath);
    return privatePath.replace(/^\/objects\//, "/public-objects/");
  };

  const handleCopyLink = async (file: UploadedFile) => {
    const routePath = file.visibility === "public"
      ? toPublicObjectRoutePath(file.objectPath)
      : toObjectRoutePath(file.objectPath);
    const url = `${window.location.origin}${routePath}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "File link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const files = filesData?.files || [];

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return files;
    
    const query = debouncedSearchQuery.toLowerCase();
    return files.filter((file: UploadedFile) => {
      const fileName = file.fileName?.toLowerCase() || "";
      const description = file.description?.toLowerCase() || "";
      const tags = Array.isArray(file.tags) ? file.tags.join(" ").toLowerCase() : "";
      
      return fileName.includes(query) || 
             description.includes(query) || 
             tags.includes(query);
    });
  }, [files, debouncedSearchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">My Files</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your uploaded files and privacy settings
            </p>
          </div>
          <FileUploadDialog>
            <Button data-testid="button-new-upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </FileUploadDialog>
        </div>
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search files by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-files"
              className="max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList data-testid="tabs-category-filter">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="tournament_poster">Posters</TabsTrigger>
          <TabsTrigger value="receipt">Receipts</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="general_upload">General</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Files Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <File className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-center" data-testid="text-no-files">
              {selectedCategory === "all" 
                ? "You haven't uploaded any files yet."
                : `No files in the ${selectedCategory} category.`}
            </p>
            <FileUploadDialog>
              <Button data-testid="button-upload-first-file">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Button>
            </FileUploadDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file: UploadedFile) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow" data-testid={`card-file-${file.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm truncate" title={file.fileName} data-testid={`text-file-name-${file.id}`}>
                        {file.fileName}
                      </CardTitle>
                      <CardDescription className="text-xs" data-testid={`text-file-size-${file.id}`}>
                        {formatFileSize(file.fileSize)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={file.visibility === "public" ? "default" : 
                           file.visibility === "hall_only" ? "secondary" : "outline"}
                    className="ml-2 shrink-0"
                    data-testid={`badge-visibility-${file.id}`}
                  >
                    {file.visibility === "public" ? <Eye className="w-3 h-3 mr-1" /> :
                     file.visibility === "hall_only" ? <Eye className="w-3 h-3 mr-1" /> :
                     <EyeOff className="w-3 h-3 mr-1" />}
                    {file.visibility === "hall_only" ? "Hall" : 
                     file.visibility.charAt(0).toUpperCase() + file.visibility.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {file.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2" data-testid={`text-description-${file.id}`}>
                      {file.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}</span>
                    <span>{file.downloadCount || 0} downloads</span>
                  </div>

                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {file.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0" data-testid={`badge-tag-${file.id}-${index}`}>
                          {tag}
                        </Badge>
                      ))}
                      {file.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{file.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Separator />
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleCopyLink(file)}
                      data-testid={`button-copy-link-${file.id}`}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = file.visibility === "public"
                          ? toPublicObjectRoutePath(file.objectPath)
                          : toObjectRoutePath(file.objectPath);
                        window.open(url, "_blank");
                      }}
                      data-testid={`button-download-${file.id}`}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFileMutation.mutate(file.id)}
                      disabled={deleteFileMutation.isPending}
                      data-testid={`button-delete-${file.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}