import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  // General Settings
  language: 'es-MX' | 'es-ES' | 'en-US';
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  notifications: boolean;
  
  // Validation Settings
  confidenceThreshold: number;
  autoValidation: boolean;
  validationTimeout: number;
  strictMode: boolean;
  
  // Display Settings
  pdfQuality: 'low' | 'medium' | 'high';
  fieldHighlight: boolean;
  showCoordinates: boolean;
  animationsEnabled: boolean;
  
  // Advanced Settings
  debugMode: boolean;
  cachingEnabled: boolean;
  maxConcurrentAnalysis: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  // API Settings
  apiTimeout: number;
  retryAttempts: number;
  batchSize: number;
}

const defaultSettings: AppSettings = {
  language: 'es-MX',
  theme: 'light',
  autoSave: true,
  notifications: true,
  confidenceThreshold: 80,
  autoValidation: false,
  validationTimeout: 30,
  strictMode: false,
  pdfQuality: 'high',
  fieldHighlight: true,
  showCoordinates: false,
  animationsEnabled: true,
  debugMode: false,
  cachingEnabled: true,
  maxConcurrentAnalysis: 3,
  logLevel: 'info',
  apiTimeout: 60,
  retryAttempts: 3,
  batchSize: 10,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(_key: K, _value: AppSettings[K]) => void;
  updateSettings: (_newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-save when settings change (if auto-save is enabled)
  useEffect(() => {
    if (settings.autoSave) {
      saveSettings();
    }
  }, [settings]);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('medicalForms_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('medicalForms_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('medicalForms_settings');
  };

  const contextValue: SettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    saveSettings,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};