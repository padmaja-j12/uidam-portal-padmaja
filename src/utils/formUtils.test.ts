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
import { createFieldChangeHandler } from './formUtils';

describe('formUtils', () => {
  describe('createFieldChangeHandler', () => {
    let mockSetFormData: jest.Mock;
    let mockSetErrors: jest.Mock;
    let errors: Record<string, string>;

    beforeEach(() => {
      mockSetFormData = jest.fn();
      mockSetErrors = jest.fn();
      errors = {};
    });

    it('should handle text input changes', () => {
      const handler = createFieldChangeHandler(
        'username',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          value: 'testuser',
          type: 'text'
        }
      };

      handler(event as any);

      expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));
      
      // Test the updater function
      const updaterFn = mockSetFormData.mock.calls[0][0];
      const prevData = { username: '', email: '' };
      const newData = updaterFn(prevData);
      
      expect(newData).toEqual({
        username: 'testuser',
        email: ''
      });
    });

    it('should handle checkbox changes', () => {
      const handler = createFieldChangeHandler(
        'isActive',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          checked: true,
          type: 'checkbox'
        }
      };

      handler(event as any);

      expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));
      
      const updaterFn = mockSetFormData.mock.calls[0][0];
      const prevData = { isActive: false };
      const newData = updaterFn(prevData);
      
      expect(newData).toEqual({
        isActive: true
      });
    });

    it('should clear field error when user starts typing', () => {
      errors = {
        username: 'Username is required',
        email: 'Email is invalid'
      };

      const handler = createFieldChangeHandler(
        'username',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          value: 'newvalue',
          type: 'text'
        }
      };

      handler(event as any);

      expect(mockSetErrors).toHaveBeenCalledWith(expect.any(Function));
      
      const updaterFn = mockSetErrors.mock.calls[0][0];
      const newErrors = updaterFn(errors);
      
      expect(newErrors).toEqual({
        username: '',
        email: 'Email is invalid'
      });
    });

    it('should not call setErrors if field has no error', () => {
      errors = {
        email: 'Email is invalid'
      };

      const handler = createFieldChangeHandler(
        'username',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          value: 'testuser',
          type: 'text'
        }
      };

      handler(event as any);

      expect(mockSetFormData).toHaveBeenCalled();
      expect(mockSetErrors).not.toHaveBeenCalled();
    });

    it('should handle textarea changes', () => {
      const handler = createFieldChangeHandler(
        'description',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          value: 'This is a long description',
          type: 'textarea'
        }
      };

      handler(event as any);

      expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));
      
      const updaterFn = mockSetFormData.mock.calls[0][0];
      const prevData = { description: '' };
      const newData = updaterFn(prevData);
      
      expect(newData).toEqual({
        description: 'This is a long description'
      });
    });

    it('should handle select changes', () => {
      const handler = createFieldChangeHandler(
        'role',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          value: 'admin'
        }
      };

      handler(event as any);

      expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));
      
      const updaterFn = mockSetFormData.mock.calls[0][0];
      const prevData = { role: 'user' };
      const newData = updaterFn(prevData);
      
      expect(newData).toEqual({
        role: 'admin'
      });
    });

    it('should preserve other form data when updating a field', () => {
      const handler = createFieldChangeHandler(
        'username',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          value: 'newuser',
          type: 'text'
        }
      };

      handler(event as any);

      const updaterFn = mockSetFormData.mock.calls[0][0];
      const prevData = {
        username: 'olduser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      const newData = updaterFn(prevData);
      
      expect(newData).toEqual({
        username: 'newuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });
    });

    it('should handle unchecking a checkbox', () => {
      const handler = createFieldChangeHandler(
        'acceptTerms',
        mockSetFormData,
        errors,
        mockSetErrors
      );

      const event = {
        target: {
          checked: false,
          type: 'checkbox'
        }
      };

      handler(event as any);

      const updaterFn = mockSetFormData.mock.calls[0][0];
      const prevData = { acceptTerms: true };
      const newData = updaterFn(prevData);
      
      expect(newData).toEqual({
        acceptTerms: false
      });
    });
  });
});
