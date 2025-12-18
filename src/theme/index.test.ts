/********************************************************************************
* Copyright (c) 2025 Harman International
*
* <p>Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* <p>http://www.apache.org/licenses/LICENSE-2.0  
*
* <p> Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* <p>SPDX-License-Identifier: Apache-2.0
********************************************************************************/
import { lightTheme, darkTheme, getTheme } from './index';

describe('Theme Configuration', () => {
  describe('lightTheme', () => {
    it('should be defined', () => {
      expect(lightTheme).toBeDefined();
    });

    it('should have light mode palette', () => {
      expect(lightTheme.palette?.mode).toBe('light');
    });

    it('should have primary UIDAM blue color', () => {
      expect(lightTheme.palette?.primary?.main).toBe('#00a6e3');
    });

    it('should have correct primary color variants', () => {
      expect(lightTheme.palette?.primary?.light).toBe('#33b8e8');
      expect(lightTheme.palette?.primary?.dark).toBe('#0085b8');
      expect(lightTheme.palette?.primary?.contrastText).toBe('#ffffff');
    });

    it('should have correct secondary colors', () => {
      expect(lightTheme.palette?.secondary?.main).toBe('#f2f2f2');
      expect(lightTheme.palette?.secondary?.light).toBe('#f8f8f8');
      expect(lightTheme.palette?.secondary?.dark).toBe('#e0e0e0');
    });

    it('should have correct background colors', () => {
      expect(lightTheme.palette?.background?.default).toBe('#fafafa');
      expect(lightTheme.palette?.background?.paper).toBe('#ffffff');
    });

    it('should have correct text colors', () => {
      expect(lightTheme.palette?.text?.primary).toBe('#333333');
      expect(lightTheme.palette?.text?.secondary).toBe('#666666');
    });

    it('should have custom colors defined', () => {
      expect(lightTheme.customColors).toBeDefined();
      expect(lightTheme.customColors?.uidamBlue).toBe('#00a6e3');
      expect(lightTheme.customColors?.uidamBlueLight).toBe('#33b8e8');
      expect(lightTheme.customColors?.uidamBlueDark).toBe('#0085b8');
    });

    it('should have gradient background', () => {
      expect(lightTheme.customColors?.backgroundGradient).toContain('linear-gradient');
      expect(lightTheme.customColors?.backgroundGradient).toContain('#00a6e3');
      expect(lightTheme.customColors?.backgroundGradient).toContain('#0085b8');
    });

    it('should have custom surface colors', () => {
      expect(lightTheme.customColors?.cardBackground).toBe('#ffffff');
      expect(lightTheme.customColors?.sidebarBackground).toBe('#ffffff');
      expect(lightTheme.customColors?.headerBackground).toBe('#ffffff');
    });

    it('should have typography configuration', () => {
      expect(lightTheme.typography?.fontFamily).toContain('Roboto');
    });

    it('should have heading typography styles', () => {
      expect(lightTheme.typography?.h1?.fontSize).toBe('2.5rem');
      expect(lightTheme.typography?.h1?.fontWeight).toBe(600);
      expect(lightTheme.typography?.h1?.color).toBe('#00a6e3');
    });

    it('should have shape configuration', () => {
      expect(lightTheme.shape?.borderRadius).toBe(8);
    });

    it('should have button component overrides', () => {
      expect(lightTheme.components?.MuiButton?.styleOverrides).toBeDefined();
    });

    it('should have card component overrides', () => {
      expect(lightTheme.components?.MuiCard?.styleOverrides).toBeDefined();
    });
  });

  describe('darkTheme', () => {
    it('should be defined', () => {
      expect(darkTheme).toBeDefined();
    });

    it('should have dark mode palette', () => {
      expect(darkTheme.palette?.mode).toBe('dark');
    });

    it('should have primary color adjusted for dark mode', () => {
      expect(darkTheme.palette?.primary?.main).toBe('#33b8e8');
      expect(darkTheme.palette?.primary?.light).toBe('#66c4ea');
      expect(darkTheme.palette?.primary?.dark).toBe('#00a6e3');
    });

    it('should have dark background colors', () => {
      expect(darkTheme.palette?.background?.default).toBe('#121212');
      expect(darkTheme.palette?.background?.paper).toBe('#1e1e1e');
    });

    it('should have dark text colors', () => {
      expect(darkTheme.palette?.text?.primary).toBe('#ffffff');
      expect(darkTheme.palette?.text?.secondary).toBe('#b3b3b3');
    });

    it('should have custom colors for dark mode', () => {
      expect(darkTheme.customColors?.cardBackground).toBe('#1e1e1e');
      expect(darkTheme.customColors?.sidebarBackground).toBe('#1e1e1e');
      expect(darkTheme.customColors?.headerBackground).toBe('#1e1e1e');
    });

    it('should have dark gradient background', () => {
      expect(darkTheme.customColors?.backgroundGradient).toContain('linear-gradient');
      expect(darkTheme.customColors?.backgroundGradient).toContain('#0085b8');
      expect(darkTheme.customColors?.backgroundGradient).toContain('#1a1a1a');
    });

    it('should have same typography configuration as light theme', () => {
      expect(darkTheme.typography?.fontFamily).toContain('Roboto');
      expect(darkTheme.typography?.h1?.fontSize).toBe('2.5rem');
    });

    it('should have same shape configuration as light theme', () => {
      expect(darkTheme.shape?.borderRadius).toBe(8);
    });

    it('should have secondary colors for dark mode', () => {
      expect(darkTheme.palette?.secondary?.main).toBe('#404040');
      expect(darkTheme.palette?.secondary?.light).toBe('#606060');
      expect(darkTheme.palette?.secondary?.dark).toBe('#303030');
    });

    it('should have divider color for dark mode', () => {
      expect(darkTheme.palette?.divider).toBe('#333333');
    });
  });

  describe('getTheme function', () => {
    it('should return lightTheme when mode is light', () => {
      const theme = getTheme('light');
      expect(theme).toBe(lightTheme);
      expect(theme.palette?.mode).toBe('light');
    });

    it('should return darkTheme when mode is dark', () => {
      const theme = getTheme('dark');
      expect(theme).toBe(darkTheme);
      expect(theme.palette?.mode).toBe('dark');
    });

    it('should handle light mode case', () => {
      const theme = getTheme('light');
      expect(theme.palette?.background?.default).toBe('#fafafa');
    });

    it('should handle dark mode case', () => {
      const theme = getTheme('dark');
      expect(theme.palette?.background?.default).toBe('#121212');
    });
  });

  describe('theme consistency', () => {
    it('both themes should have the same typography structure', () => {
      expect(lightTheme.typography?.h1?.fontSize).toBe(darkTheme.typography?.h1?.fontSize);
      expect(lightTheme.typography?.h2?.fontSize).toBe(darkTheme.typography?.h2?.fontSize);
      expect(lightTheme.typography?.body1?.fontSize).toBe(darkTheme.typography?.body1?.fontSize);
    });

    it('both themes should have the same shape configuration', () => {
      expect(lightTheme.shape?.borderRadius).toBe(darkTheme.shape?.borderRadius);
    });

    it('both themes should have button overrides', () => {
      expect(lightTheme.components?.MuiButton).toBeDefined();
      expect(darkTheme.components?.MuiButton).toBeDefined();
    });

    it('both themes should have card overrides', () => {
      expect(lightTheme.components?.MuiCard).toBeDefined();
      expect(darkTheme.components?.MuiCard).toBeDefined();
    });

    it('both themes should have TextField overrides', () => {
      expect(lightTheme.components?.MuiTextField).toBeDefined();
      expect(darkTheme.components?.MuiTextField).toBeDefined();
    });

    it('both themes should have TableHead overrides', () => {
      expect(lightTheme.components?.MuiTableHead).toBeDefined();
      expect(darkTheme.components?.MuiTableHead).toBeDefined();
    });

    it('both themes should have Chip overrides', () => {
      expect(lightTheme.components?.MuiChip).toBeDefined();
      expect(darkTheme.components?.MuiChip).toBeDefined();
    });
  });

  describe('custom colors interface', () => {
    it('lightTheme should have all custom color properties', () => {
      expect(lightTheme.customColors?.backgroundGradient).toBeDefined();
      expect(lightTheme.customColors?.cardBackground).toBeDefined();
      expect(lightTheme.customColors?.sidebarBackground).toBeDefined();
      expect(lightTheme.customColors?.headerBackground).toBeDefined();
      expect(lightTheme.customColors?.uidamBlue).toBeDefined();
      expect(lightTheme.customColors?.uidamBlueLight).toBeDefined();
      expect(lightTheme.customColors?.uidamBlueDark).toBeDefined();
    });

    it('darkTheme should have all custom color properties', () => {
      expect(darkTheme.customColors?.backgroundGradient).toBeDefined();
      expect(darkTheme.customColors?.cardBackground).toBeDefined();
      expect(darkTheme.customColors?.sidebarBackground).toBeDefined();
      expect(darkTheme.customColors?.headerBackground).toBeDefined();
      expect(darkTheme.customColors?.uidamBlue).toBeDefined();
      expect(darkTheme.customColors?.uidamBlueLight).toBeDefined();
      expect(darkTheme.customColors?.uidamBlueDark).toBeDefined();
    });
  });
});
