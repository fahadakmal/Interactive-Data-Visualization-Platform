import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Typography, 
  Button, 
  List, 
  CircularProgress,
  Fade,
  Alert,
  Paper,
} from '@mui/material';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useVisualization } from '../../contexts/VisualizationContext';
import FileItem from '../ui/FileItem';

interface FileUploadStepProps {
  onNext: () => void;
}

const FileUploadStep: React.FC<FileUploadStepProps> = ({ onNext }) => {
  const { files, addFile, removeFile } = useVisualization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // Process files sequentially to avoid overwhelming the browser
      for (const file of acceptedFiles) {
        if (!file.name.endsWith('.csv')) {
          throw new Error('Only CSV files are supported');
        }
        await addFile(file);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setLoading(false);
    }
  }, [addFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload CSV Files
      </Typography>
      
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          my: 3,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 2,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: (theme) => 
            isDragActive 
              ? theme.palette.primary.main 
              : theme.palette.grey[300],
          bgcolor: (theme) => 
            isDragActive 
              ? theme.palette.primary.light + '20' 
              : theme.palette.grey[50],
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: (theme) => theme.palette.primary.light,
            bgcolor: (theme) => theme.palette.primary.light + '10',
          },
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <input {...getInputProps()} />
        
        {loading ? (
          <CircularProgress size={48} />
        ) : (
          <>
            <Upload 
              size={48} 
              color={isDragActive ? '#2563EB' : '#9CA3AF'} 
              style={{ marginBottom: 16 }}
            />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop CSV files here'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              or click to select files
            </Typography>
          </>
        )}
      </Paper>
      
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            icon={<AlertCircle size={24} />}
            onClose={() => setError(null)}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        </Fade>
      )}
      
      {files.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          
          <List sx={{ 
            bgcolor: 'background.paper',
            borderRadius: 1,
            mt: 2,
          }}>
            {files.map((file) => (
              <FileItem 
                key={file.id} 
                file={file} 
                onRemove={() => removeFile(file.id)} 
              />
            ))}
          </List>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={files.length === 0 || loading}
          endIcon={<FileText size={18} />}
          sx={{ 
            px: 3, 
            py: 1,
          }}
        >
          Continue to Column Selection
        </Button>
      </Box>
    </Box>
  );
};

export default FileUploadStep;