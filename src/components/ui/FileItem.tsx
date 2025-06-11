import React from 'react';
import { 
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Box,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import { FileText, Trash2, BarChart4 } from 'lucide-react';
import { CSVFile } from '../../types/visualization';

interface FileItemProps {
  file: CSVFile;
  onRemove: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
  return (
    <Paper
      elevation={0}
      sx={{ 
        mb: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <ListItem
        secondaryAction={
          <Tooltip title="Remove file">
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={onRemove}
              color="error"
              sx={{ 
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.error.light + '20',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <Trash2 size={20} />
            </IconButton>
          </Tooltip>
        }
      >
        <ListItemIcon>
          <FileText color="#2563EB" size={24} />
        </ListItemIcon>
        <ListItemText 
          primary={file.name} 
          secondary={`${file.data.length} rows • ${file.columns.length} columns`}
        />
      </ListItem>
      
      <Divider />
      
      <Box sx={{ p: 1.5, backgroundColor: (theme) => theme.palette.grey[50] }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <BarChart4 size={16} color="#6B7280" />
          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            Available Columns:
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {file.columns.slice(0, 5).map((column) => (
            <Chip 
              key={column} 
              label={column} 
              size="small"
              variant="outlined"
              sx={{ 
                borderRadius: 1,
                fontSize: '0.75rem',
              }}
            />
          ))}
          {file.columns.length > 5 && (
            <Chip 
              label={`+${file.columns.length - 5} more`}
              size="small"
              sx={{ 
                borderRadius: 1,
                fontSize: '0.75rem',
                backgroundColor: (theme) => theme.palette.grey[200],
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default FileItem;