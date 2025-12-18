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
/**
 * Utility functions for form handling
 */

/**
 * Creates a generic form field change handler that handles both regular inputs and checkboxes
 * Also clears validation errors for the changed field
 * 
 * @param field - The field name to update
 * @param setFormData - State setter for form data
 * @param errors - Current validation errors object
 * @param setErrors - State setter for validation errors
 * @returns Change event handler
 */
export const createFieldChangeHandler = <T extends Record<string, any>>(
  field: keyof T,
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  errors: Record<string, string>,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  return (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown; type?: string; checked?: boolean } }
  ) => {
    const target = event.target as any;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  };
};
