# Script to add copyright header to all source files

$copyright = @"
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

"@

# Get all TypeScript and JavaScript files, excluding node_modules, dist, build, coverage
$files = Get-ChildItem -Path "src" -Include *.ts,*.tsx,*.js,*.jsx -Recurse -File | 
    Where-Object { $_.FullName -notmatch 'node_modules|dist|build|coverage' }

$addedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($null -eq $content) {
        Write-Host "Skipping empty file: $($file.FullName)" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    # Check if file already has copyright
    if ($content -match "Copyright \(c\) 202[0-9] Harman International") {
        Write-Host "Skipping (already has copyright): $($file.Name)" -ForegroundColor Gray
        $skippedCount++
        continue
    }
    
    # Add copyright at the beginning
    $newContent = $copyright + $content
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    Write-Host "Added copyright to: $($file.Name)" -ForegroundColor Green
    $addedCount++
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Files updated: $addedCount" -ForegroundColor Green
Write-Host "Files skipped: $skippedCount" -ForegroundColor Yellow
