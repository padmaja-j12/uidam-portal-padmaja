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
import { styled } from '@mui/material/styles';
import { TableHead, TableCell, TableRow } from '@mui/material';

// Enhanced table header with better styling
export const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableRow-root': {
    backgroundColor: theme.palette.grey[100],
    '& .MuiTableCell-root': {
      fontWeight: 600,
      fontSize: '0.875rem',
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      borderBottom: `2px solid ${theme.palette.divider}`,
      padding: theme.spacing(2),
      '&:first-of-type': {
        paddingLeft: theme.spacing(3),
      },
      '&:last-child': {
        paddingRight: theme.spacing(3),
      }
    }
  }
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.grey[50],
  borderBottom: `2px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  '&:first-of-type': {
    paddingLeft: theme.spacing(3),
  },
  '&:last-child': {
    paddingRight: theme.spacing(3),
  }
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .MuiTableCell-root': {
    padding: theme.spacing(1.5, 2),
    '&:first-of-type': {
      paddingLeft: theme.spacing(3),
    },
    '&:last-child': {
      paddingRight: theme.spacing(3),
    }
  }
}));
