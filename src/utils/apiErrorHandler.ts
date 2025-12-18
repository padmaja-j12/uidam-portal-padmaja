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

/**
 * Utility function to handle and log API errors consistently
 * @param error - The error object from the API call
 * @param context - Optional context string to identify where the error occurred
 */
export function handleApiError(error: any, context: string = 'API'): never {
  logger.error(`=== ${context.toUpperCase()} SERVICE ERROR DETAILS ===`);
  logger.error('Error message:', error.message);
  logger.error('Error code:', error.code);
  logger.error('Error name:', error.name);
  
  if (error.response) {
    logger.error('Response status:', error.response.status);
    logger.error('Response statusText:', error.response.statusText);
    logger.error('Response data:', error.response.data);
    logger.debug('Response data type:', typeof error.response.data);
    if (error.response.data && typeof error.response.data === 'object') {
      logger.debug('Response data keys:', Object.keys(error.response.data));
      logger.debug('Response data stringified:', JSON.stringify(error.response.data, null, 2));
    }
  } else if (error.request) {
    logger.debug('Request error details:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
      timeout: error.config?.timeout,
      data: error.config?.data
    });
    logger.debug('XMLHttpRequest details:', {
      readyState: error.request.readyState,
      status: error.request.status,
      statusText: error.request.statusText,
      responseURL: error.request.responseURL
    });
  }
  logger.error('=== END ERROR DETAILS ===');
  throw error;
}
