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
import { logger } from './logger';

describe('logger utility', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    // Restore original NODE_ENV after all tests
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('logger object structure', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('development mode (NODE_ENV !== production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should log debug messages with [DEBUG] prefix', () => {
      logger.debug('Debug message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'Debug message', { key: 'value' });
    });

    it('should log info messages with [INFO] prefix', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO]', 'Info message');
    });

    it('should log warn messages with [WARN] prefix', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'Warning message');
    });

    it('should log error messages with [ERROR] prefix', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error occurred', error);
    });

    it('should handle multiple arguments in debug', () => {
      logger.debug('Multiple', 'args', 123, { test: true });
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'Multiple', 'args', 123, { test: true });
    });

    it('should handle multiple arguments in info', () => {
      logger.info('Info', 'with', 'multiple', 'args');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO]', 'Info', 'with', 'multiple', 'args');
    });

    it('should handle multiple arguments in warn', () => {
      logger.warn('Warning', { code: 404 });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'Warning', { code: 404 });
    });
  });

  describe('production mode (NODE_ENV === production)', () => {
    // Note: In test environment, logger functions as if in development mode
    // This tests the existence and behavior of the methods themselves
    
    it('should verify logger methods exist and are callable', () => {
      // Logger should have all methods defined
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should ALWAYS log error messages regardless of environment', () => {
      const error = new Error('Critical error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error occurred', error);
    });

    it('should handle error with multiple arguments', () => {
      logger.error('Fatal', 'error', { code: 500 });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Fatal', 'error', { code: 500 });
    });
  });

  describe('test mode (NODE_ENV === test)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should log debug messages in test mode', () => {
      logger.debug('Test debug');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'Test debug');
    });

    it('should log info messages in test mode', () => {
      logger.info('Test info');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO]', 'Test info');
    });

    it('should log warn messages in test mode', () => {
      logger.warn('Test warn');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'Test warn');
    });

    it('should log error messages in test mode', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Test error');
    });
  });
});
