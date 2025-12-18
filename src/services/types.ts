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
// Common types for UIDAM API services

export interface ApiResponse<T> {
  code?: string;
  message?: string;
  data?: T;
  httpStatus?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface BaseEntity {
  id: string | number;
  createdBy?: string;
  createDate?: string;
  updatedBy?: string;
  updateDate?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  path: string;
}

// Common status types
export type UserStatus = 'PENDING' | 'BLOCKED' | 'REJECTED' | 'ACTIVE' | 'DELETED' | 'DEACTIVATED';
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'DELETED';
export type Gender = 'MALE' | 'FEMALE';

// Sort and search types
export type SortOrder = 'ASC' | 'DESC';
export type SearchType = 'PREFIX' | 'SUFFIX' | 'CONTAINS' | 'EQUAL';

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: SortOrder;
  ignoreCase?: boolean;
  searchType?: SearchType;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Common response message structure
export interface ResponseMessage {
  key: string;
  parameters?: any[];
}

export interface BaseListResponse<T> {
  messages?: ResponseMessage[];
  results: T[];
}
