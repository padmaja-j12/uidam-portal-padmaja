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
// src/config/runtimeConfig.ts
// Utility to load and provide runtime config from public/config.json

/*
* config.js
* Copyright (c) Harman International Industries, Incorporated, 2024 - 2025
* All rights reserved.
*/

export interface RuntimeConfig {
  KEYCLOAK_URL?: string;
  KEYCLOAK_REALM?: string;
  KEYCLOAK_CLIENT_ID?: string;
  API_BASE_URL?: string;
  [key: string]: any;
}

let runtimeConfig: RuntimeConfig = {};

export const loadRuntimeConfig = async (): Promise<RuntimeConfig> => {
  try {
    const response = await fetch("/config.json");
    runtimeConfig = await response.json();
    (window as any)._APP_CONFIG = runtimeConfig;
    return runtimeConfig;
  } catch (error) {
    console.error("Failed to load config.json:", error);
    throw error;
  }
};

export const getConfig = (): RuntimeConfig => runtimeConfig;

// Legacy export for backward compatibility
export const loadConfig = loadRuntimeConfig;


