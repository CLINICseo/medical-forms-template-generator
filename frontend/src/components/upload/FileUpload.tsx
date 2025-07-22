import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const DropzoneContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.default,
  border: `2px dashed ${theme.palette.primary.main}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.dark,
  },
}));

const DropzoneActive = styled(DropzoneContainer)(({ theme }) => ({
  backgroundColor: theme.palette.action.selected,
  borderColor: theme.palette.primary.dark,
  borderWidth: 3,
}));

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploadProps {
  onFileUpload: (_file: File) => Promise<void>;
  maxFileSize?: number; // in MB
  accept?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  maxFileSize = 10,
  accept = ['application/pdf'],
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set());

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((file) => {
          if (file.file.size > maxFileSize * 1024 * 1024) {
            return `${file.file.name}: File size exceeds ${maxFileSize}MB`;
          }
          return `${file.file.name}: Invalid file type`;
        });
        setError(errors.join(', '));
        return;
      }

      // Add accepted files  
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }) as FileWithPreview
      );
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize * 1024 * 1024,
    multiple: false,
  });

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
    setUploadedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileName);
      return newSet;
    });
  };

  const uploadFiles = async () => {
    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (uploadedFiles.has(file.name)) {
        continue; // Skip already uploaded files
      }

      try {
        setUploadProgress((i / files.length) * 100);
        await onFileUpload(file);
        setUploadedFiles((prev) => new Set(prev).add(file.name));
      } catch (err) {
        setError(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        break;
      }
    }

    setUploading(false);
    setUploadProgress(100);
  };

  const DropzoneComponent = isDragActive ? DropzoneActive : DropzoneContainer;

  return (
    <Box>
      <DropzoneComponent {...getRootProps()}>
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the PDF file here'
            : 'Drag & drop a PDF file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maximum file size: {maxFileSize}MB
        </Typography>
      </DropzoneComponent>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Files to upload
          </Typography>
          <List>
            {files.map((file) => (
              <ListItem
                key={file.name}
                secondaryAction={
                  !uploadedFiles.has(file.name) && (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeFile(file.name)}
                      disabled={uploading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  {uploadedFiles.has(file.name) ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <FileIcon color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={uploadFiles}
            disabled={uploading || files.every((file) => uploadedFiles.has(file.name))}
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </Box>
      )}
    </Box>
  );
};