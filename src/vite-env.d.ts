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
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UIDAM_AUTH_SERVER_URL: string
  readonly VITE_UIDAM_USER_MANAGEMENT_URL: string
  readonly VITE_FEATURE_USER_MANAGEMENT: string
  readonly VITE_FEATURE_ROLE_MANAGEMENT: string
  readonly VITE_FEATURE_SCOPE_MANAGEMENT: string
  readonly VITE_FEATURE_APPROVAL_WORKFLOW: string
  readonly VITE_FEATURE_AUDIT_LOGS: string
  readonly VITE_FEATURE_REAL_TIME_UPDATES: string
  readonly VITE_OAUTH_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
