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
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Table, TableBody, TableContainer } from '@mui/material';
import { StyledTableHead, StyledTableCell, StyledTableRow } from './StyledTableComponents';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <TableContainer>
        <Table>
          {component}
        </Table>
      </TableContainer>
    </ThemeProvider>
  );
};

describe('StyledTableComponents', () => {
  describe('StyledTableHead', () => {
    it('renders table head correctly', () => {
      const { container } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>Header 1</StyledTableCell>
            <StyledTableCell>Header 2</StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      const tableHead = container.querySelector('thead');
      expect(tableHead).toBeInTheDocument();
    });

    it('applies correct styling to table head', () => {
      const { container } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>Header</StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      const tableHead = container.querySelector('thead');
      expect(tableHead).toHaveClass('MuiTableHead-root');
    });

    it('renders multiple header cells', () => {
      const { getByText } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>Name</StyledTableCell>
            <StyledTableCell>Email</StyledTableCell>
            <StyledTableCell>Status</StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      expect(getByText('Name')).toBeInTheDocument();
      expect(getByText('Email')).toBeInTheDocument();
      expect(getByText('Status')).toBeInTheDocument();
    });

    it('supports empty header', () => {
      const { container } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow />
        </StyledTableHead>
      );

      expect(container.querySelector('thead')).toBeInTheDocument();
    });
  });

  describe('StyledTableCell', () => {
    it('renders table cell correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>Cell Content</StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      expect(getByText('Cell Content')).toBeInTheDocument();
    });

    it('renders with text content', () => {
      const { getByText } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>Test Cell</StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      const cell = getByText('Test Cell');
      expect(cell).toHaveClass('MuiTableCell-root');
    });

    it('renders with numeric content', () => {
      const { getByText } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>123</StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      expect(getByText('123')).toBeInTheDocument();
    });

    it('renders with child components', () => {
      const { getByText } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell>
              <span>Nested Content</span>
            </StyledTableCell>
          </StyledTableRow>
        </StyledTableHead>
      );

      expect(getByText('Nested Content')).toBeInTheDocument();
    });

    it('supports empty cell', () => {
      const { container } = renderWithTheme(
        <StyledTableHead>
          <StyledTableRow>
            <StyledTableCell />
          </StyledTableRow>
        </StyledTableHead>
      );

      expect(container.querySelector('.MuiTableCell-root')).toBeInTheDocument();
    });
  });

  describe('StyledTableRow', () => {
    it('renders table row correctly', () => {
      const { container } = renderWithTheme(
        <TableBody>
          <StyledTableRow>
            <StyledTableCell>Row Content</StyledTableCell>
          </StyledTableRow>
        </TableBody>
      );

      const row = container.querySelector('tr');
      expect(row).toBeInTheDocument();
    });

    it('renders with multiple cells', () => {
      const { getByText } = renderWithTheme(
        <TableBody>
          <StyledTableRow>
            <StyledTableCell>Cell 1</StyledTableCell>
            <StyledTableCell>Cell 2</StyledTableCell>
            <StyledTableCell>Cell 3</StyledTableCell>
          </StyledTableRow>
        </TableBody>
      );

      expect(getByText('Cell 1')).toBeInTheDocument();
      expect(getByText('Cell 2')).toBeInTheDocument();
      expect(getByText('Cell 3')).toBeInTheDocument();
    });

    it('applies hover styling', () => {
      const { container } = renderWithTheme(
        <TableBody>
          <StyledTableRow>
            <StyledTableCell>Hoverable Row</StyledTableCell>
          </StyledTableRow>
        </TableBody>
      );

      const row = container.querySelector('tr');
      expect(row).toHaveClass('MuiTableRow-root');
    });

    it('renders empty row', () => {
      const { container } = renderWithTheme(
        <TableBody>
          <StyledTableRow />
        </TableBody>
      );

      expect(container.querySelector('tr')).toBeInTheDocument();
    });

    it('renders multiple rows', () => {
      const { getByText } = renderWithTheme(
        <TableBody>
          <StyledTableRow>
            <StyledTableCell>Row 1</StyledTableCell>
          </StyledTableRow>
          <StyledTableRow>
            <StyledTableCell>Row 2</StyledTableCell>
          </StyledTableRow>
          <StyledTableRow>
            <StyledTableCell>Row 3</StyledTableCell>
          </StyledTableRow>
        </TableBody>
      );

      expect(getByText('Row 1')).toBeInTheDocument();
      expect(getByText('Row 2')).toBeInTheDocument();
      expect(getByText('Row 3')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('renders complete table structure', () => {
      const { getByText } = renderWithTheme(
        <>
          <StyledTableHead>
            <StyledTableRow>
              <StyledTableCell>Header 1</StyledTableCell>
              <StyledTableCell>Header 2</StyledTableCell>
            </StyledTableRow>
          </StyledTableHead>
          <TableBody>
            <StyledTableRow>
              <StyledTableCell>Data 1</StyledTableCell>
              <StyledTableCell>Data 2</StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </>
      );

      expect(getByText('Header 1')).toBeInTheDocument();
      expect(getByText('Header 2')).toBeInTheDocument();
      expect(getByText('Data 1')).toBeInTheDocument();
      expect(getByText('Data 2')).toBeInTheDocument();
    });

    it('maintains structure with mixed content types', () => {
      const { getByText } = renderWithTheme(
        <TableBody>
          <StyledTableRow>
            <StyledTableCell>Text</StyledTableCell>
            <StyledTableCell>123</StyledTableCell>
            <StyledTableCell>
              <span>Component</span>
            </StyledTableCell>
          </StyledTableRow>
        </TableBody>
      );

      expect(getByText('Text')).toBeInTheDocument();
      expect(getByText('123')).toBeInTheDocument();
      expect(getByText('Component')).toBeInTheDocument();
    });

    it('renders styled components with theme', () => {
      const { container } = renderWithTheme(
        <>
          <StyledTableHead>
            <StyledTableRow>
              <StyledTableCell>Themed Header</StyledTableCell>
            </StyledTableRow>
          </StyledTableHead>
          <TableBody>
            <StyledTableRow>
              <StyledTableCell>Themed Cell</StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </>
      );

      expect(container.querySelector('.MuiTableHead-root')).toBeInTheDocument();
      expect(container.querySelectorAll('.MuiTableRow-root').length).toBeGreaterThan(0);
    });
  });

  describe('Component Exports', () => {
    it('exports StyledTableHead', () => {
      expect(StyledTableHead).toBeDefined();
      expect(typeof StyledTableHead).toBe('object');
    });

    it('exports StyledTableCell', () => {
      expect(StyledTableCell).toBeDefined();
      expect(typeof StyledTableCell).toBe('object');
    });

    it('exports StyledTableRow', () => {
      expect(StyledTableRow).toBeDefined();
      expect(typeof StyledTableRow).toBe('object');
    });
  });
});
