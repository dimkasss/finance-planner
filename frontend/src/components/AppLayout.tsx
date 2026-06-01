'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '@/lib/auth-context';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Главная', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'История', icon: <ReceiptLongIcon />, path: '/transactions' },
  { text: 'Категории', icon: <CategoryIcon />, path: '/categories' },
  { text: 'Аналитика', icon: <BarChartIcon />, path: '/analytics' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 2, py: 1.5, alignItems: 'center' }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5,
            background: 'linear-gradient(135deg, #fafafa 0%, #a1a1aa 100%)',
            boxShadow: '0 10px 24px rgba(255,255,255,0.08)',
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: '#111111', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#fafafa',
              lineHeight: 1.1,
            }}
          >
            FinAssist
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Finance Dashboard
          </Typography>
        </Box>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => {
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                color: 'text.secondary',
                '& .MuiListItemIcon-root': {
                  color: 'text.secondary',
                  minWidth: 40,
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: 'text.primary',
                  '& .MuiListItemIcon-root': { color: 'text.primary' },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fafafa',
                  '& .MuiListItemIcon-root': { color: '#fafafa' },
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)' },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, color: '#e4e4e7', fontWeight: 700 }}
          >
            {menuItems.find((item) => item.path === pathname)?.text || 'FinAssist'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
            {user?.name}
          </Typography>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              color: '#e4e4e7',
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.06)',
              },
            }}
          >
            Выйти
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
