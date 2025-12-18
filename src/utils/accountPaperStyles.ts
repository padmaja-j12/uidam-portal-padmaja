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
import { SxProps, Theme } from '@mui/material';

/**
 * Interface for account mapping with selection state
 */
export interface AccountSelectionState {
  isAccountSelected: boolean;
  isDefaultAccount?: boolean;
}

/**
 * Gets the Paper component styles for account role mappings
 * Provides consistent styling across the application for account selection states
 * 
 * @param mapping - The account mapping with selection state
 * @returns SxProps for the Paper component
 */
export function getAccountPaperStyles(mapping: AccountSelectionState): SxProps<Theme> {
  return {
    p: 2,
    mb: 2,
    border: (() => {
      if (mapping.isAccountSelected && mapping.isDefaultAccount) return '2px solid #4caf50';
      if (mapping.isAccountSelected) return '2px solid #2196f3';
      return '1px solid #e0e0e0';
    })(),
    bgcolor: (() => {
      if (mapping.isAccountSelected && mapping.isDefaultAccount) return '#f1f8e9';
      if (mapping.isAccountSelected) return '#e3f2fd';
      return '#f9f9f9';
    })(),
    opacity: mapping.isAccountSelected ? 1 : 0.7
  };
}
