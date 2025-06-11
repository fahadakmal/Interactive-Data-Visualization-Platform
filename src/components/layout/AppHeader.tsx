import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  useTheme,
  Tooltip,
} from '@mui/material';
import { LineChart, Github } from 'lucide-react';

const AppHeader: React.FC = () => {
  const theme = useTheme();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.warning.main} 90%)`,
      }}
    >
      <Toolbar>
        <LineChart size={32} color="white" />
        <Typography
          variant="h5"
          component="div"
          sx={{ 
            ml: 1.5,
            fontWeight: 600,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          DataViz
        </Typography>
        
        <Box sx={{ display: 'flex' }}>
          
          <Tooltip title="GitHub">
            <IconButton
              color="inherit"
              aria-label="github"
              edge="end"
              sx={{ 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' } 
              }}
            >
              <Github size={24} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;