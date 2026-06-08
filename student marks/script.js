// State Management
let students = [];
let chartInstance = null;
let deleteTargetId = null;

// Initial Dummy Data (to showcase features instantly if local storage is empty)
const dummyStudents = [
  { id: 'CS2026-001', name: 'Sneha Reddy', year: '1st Year', english: 90, physics: 88, maths: 94, hindi: 85, total: 357, percentage: 89.25 },
  { id: 'CS2026-002', name: 'Rahul Sharma', year: '3rd Year', english: 85, physics: 92, maths: 95, hindi: 78, total: 350, percentage: 87.50 },
  { id: 'CS2026-003', name: 'Priya Patel', year: '2nd Year', english: 72, physics: 68, maths: 74, hindi: 82, total: 296, percentage: 74.00 },
  { id: 'CS2026-004', name: 'Amit Verma', year: '4th Year', english: 45, physics: 48, maths: 52, hindi: 40, total: 185, percentage: 46.25 }
];

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  setupNavigation();
  setupFormListeners();
  setupRecordsListeners();
  setupModals();
  updateUI();
});

// ==========================================
// Theme Management (Light / Dark Mode)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleUI(savedTheme);

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleUI(newTheme);
    
    // Redraw chart to match theme colors if charts are initialized
    if (chartInstance) {
      renderCharts();
    }
  });
}

function updateThemeToggleUI(theme) {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const toggleText = document.getElementById('themeToggleText');
  
  if (theme === 'dark') {
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: #fbbf24;"></i> <span id="themeToggleText">Light Mode</span>';
    toggleBtn.style.background = 'rgba(251, 191, 36, 0.1)';
    toggleBtn.style.borderColor = 'rgba(251, 191, 36, 0.2)';
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span id="themeToggleText">Dark Mode</span>';
    toggleBtn.style.background = '';
    toggleBtn.style.borderColor = '';
  }
}

// ==========================================
// Data Storage & Sync
// ==========================================
function loadData() {
  const localData = localStorage.getItem('students_records');
  if (localData) {
    students = JSON.parse(localData);
  } else {
    // Populate with dummy data initially
    students = [...dummyStudents];
    localStorage.setItem('students_records', JSON.stringify(students));
    showToast('Success', 'Populated with sample student records!', 'success');
  }
}

function saveData() {
  localStorage.setItem('students_records', JSON.stringify(students));
}

// ==========================================
// SPA Navigation & Mobile Menu
// ==========================================
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.app-section');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('appSidebar');

  // Nav Item click events
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = item.getAttribute('data-target');
      
      // Update Nav Active State
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      // Display current section
      sections.forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === `${targetSection}-section`) {
          sec.classList.add('active');
        }
      });
      
      // Update Header Text dynamically
      updateHeaderText(targetSection);
      
      // Close Sidebar on Mobile click
      sidebar.classList.remove('mobile-open');
      
      // Refresh UI if necessary
      if (targetSection === 'dashboard') {
        renderCharts();
      }
    });
  });

  // Mobile Menu Button Toggle
  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // Close sidebar clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target) && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });

  // Redirect to add student page from empty state
  document.getElementById('goToAddBtn').addEventListener('click', () => {
    document.getElementById('navAddStudent').click();
  });
}

function updateHeaderText(section) {
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  
  if (section === 'dashboard') {
    pageTitle.textContent = 'Dashboard';
    pageSubtitle.textContent = "Welcome back! Here's the performance overview of your college students.";
  } else if (section === 'add-student') {
    const isEdit = document.getElementById('editStudentId').value !== "";
    pageTitle.textContent = isEdit ? 'Edit Student Record' : 'Add Student';
    pageSubtitle.textContent = isEdit ? 'Modify student and marks information below.' : 'Enter new student credentials and semester marks below.';
  } else if (section === 'records') {
    pageTitle.textContent = 'Student Records';
    pageSubtitle.textContent = 'View, manage, search, sort, and export student performance records.';
  }
}

// ==========================================
// Student Form & Live Calculations
// ==========================================
function setupFormListeners() {
  const form = document.getElementById('studentForm');
  const markInputs = document.querySelectorAll('.mark-field');
  const resetBtn = document.getElementById('resetFormBtn');

  // Input listeners for live calculation of Marks
  markInputs.forEach(input => {
    input.addEventListener('input', () => {
      // Clean leading zeros or invalid numbers
      if (input.value > 100) input.value = 100;
      if (input.value < 0) input.value = 0;
      calculateLiveResults();
    });
  });

  // Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  });

  // Reset Button Handler
  resetBtn.addEventListener('click', () => {
    resetForm();
    showToast('Form Reset', 'The form values were cleared successfully.', 'info');
  });
}

function calculateLiveResults() {
  const english = parseFloat(document.getElementById('englishMarks').value) || 0;
  const physics = parseFloat(document.getElementById('physicsMarks').value) || 0;
  const maths = parseFloat(document.getElementById('mathsMarks').value) || 0;
  const hindi = parseFloat(document.getElementById('hindiMarks').value) || 0;

  const total = english + physics + maths + hindi;
  const percentage = (total / 400) * 100;
  
  document.getElementById('liveTotal').textContent = `${total} / 400`;
  document.getElementById('livePercentage').textContent = `${percentage.toFixed(2)}%`;
  
  const gradeLabel = document.getElementById('liveGrade');
  if (percentage >= 75) {
    gradeLabel.textContent = 'Distinction';
    gradeLabel.style.color = '#10b981'; // Green
  } else if (percentage >= 50) {
    gradeLabel.textContent = 'First Class';
    gradeLabel.style.color = '#f97316'; // Orange
  } else {
    gradeLabel.textContent = 'Second Class / Fail';
    gradeLabel.style.color = '#ef4444'; // Red
  }
}

function handleFormSubmit() {
  const name = document.getElementById('studentName').value.trim();
  const studentId = document.getElementById('studentId').value.trim();
  const academicYear = document.getElementById('academicYear').value;
  const english = parseFloat(document.getElementById('englishMarks').value);
  const physics = parseFloat(document.getElementById('physicsMarks').value);
  const maths = parseFloat(document.getElementById('mathsMarks').value);
  const hindi = parseFloat(document.getElementById('hindiMarks').value);
  const editId = document.getElementById('editStudentId').value;

  // Manual input checking
  if (!name || !studentId || !academicYear || isNaN(english) || isNaN(physics) || isNaN(maths) || isNaN(hindi)) {
    showToast('Input Error', 'Please fill out all fields with valid information.', 'error');
    return;
  }

  // Marks boundary verification
  if (english < 0 || english > 100 || physics < 0 || physics > 100 || maths < 0 || maths > 100 || hindi < 0 || hindi > 100) {
    showToast('Validation Error', 'Marks must be within 0 to 100 range.', 'error');
    return;
  }

  // Check unique Student ID (if new student OR ID changed)
  const existingStudent = students.find(s => s.id.toLowerCase() === studentId.toLowerCase());
  
  if (editId) {
    // Editing Mode
    if (existingStudent && existingStudent.id.toLowerCase() !== editId.toLowerCase()) {
      showToast('Validation Error', `A student with ID "${studentId}" already exists.`, 'error');
      return;
    }
    
    // Find index and update
    const idx = students.findIndex(s => s.id.toLowerCase() === editId.toLowerCase());
    if (idx !== -1) {
      const total = english + physics + maths + hindi;
      const percentage = (total / 400) * 100;
      
      students[idx] = {
        id: studentId,
        name,
        year: academicYear,
        english,
        physics,
        maths,
        hindi,
        total,
        percentage: parseFloat(percentage.toFixed(2))
      };
      
      showToast('Record Updated', `Successfully updated record for ${name}.`, 'success');
    }
  } else {
    // Add New Student Mode
    if (existingStudent) {
      showToast('Validation Error', `A student with ID "${studentId}" already exists.`, 'error');
      return;
    }
    
    const total = english + physics + maths + hindi;
    const percentage = (total / 400) * 100;
    
    students.push({
      id: studentId,
      name,
      year: academicYear,
      english,
      physics,
      maths,
      hindi,
      total,
      percentage: parseFloat(percentage.toFixed(2))
    });
    
    showToast('Record Added', `Successfully saved results for ${name}.`, 'success');
  }

  saveData();
  resetForm();
  updateUI();
  
  // Transition back to records section
  setTimeout(() => {
    document.querySelector('.nav-item[data-target="records"]').click();
  }, 300);
}

function resetForm() {
  document.getElementById('studentForm').reset();
  document.getElementById('editStudentId').value = "";
  
  // Reset live calculations
  document.getElementById('liveTotal').textContent = '0 / 400';
  document.getElementById('livePercentage').textContent = '0.0%';
  document.getElementById('liveGrade').textContent = '--';
  document.getElementById('liveGrade').style.color = '';
  
  // Toggle form title back to default Add mode
  document.getElementById('formSectionTitle').innerHTML = '<i class="fa-solid fa-user-plus text-blue"></i> Register New Student & Marks';
  document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Save Student Record';
  
  // Enable ID input field if it was locked during edit mode
  document.getElementById('studentId').removeAttribute('disabled');
}

// ==========================================
// Records Page: Filtering, Sorting & Tables
// ==========================================
function setupRecordsListeners() {
  const searchBar = document.getElementById('searchBar');
  const filterYear = document.getElementById('filterYear');
  const sortRecords = document.getElementById('sortRecords');
  const thPercentage = document.getElementById('thPercentage');
  
  // Live Search Filter
  searchBar.addEventListener('input', () => renderRecordsTable());
  
  // Dropdown Filters
  filterYear.addEventListener('change', () => renderRecordsTable());
  sortRecords.addEventListener('change', () => renderRecordsTable());
  
  // Table Header Click for Percentage sort
  let pctSortDirection = true; // true = desc, false = asc
  thPercentage.addEventListener('click', () => {
    pctSortDirection = !pctSortDirection;
    sortRecords.value = pctSortDirection ? 'pct-desc' : 'pct-asc';
    renderRecordsTable();
  });

  // Export Events
  document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
}

function renderRecordsTable() {
  const searchVal = document.getElementById('searchBar').value.toLowerCase().trim();
  const yearFilter = document.getElementById('filterYear').value;
  const sortVal = document.getElementById('sortRecords').value;
  
  const tbody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('studentsTable');
  
  // Clear standard layout
  tbody.innerHTML = '';
  
  // 1. Filtering
  let filtered = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchVal) || student.id.toLowerCase().includes(searchVal);
    const matchesYear = (yearFilter === 'All') || (student.year === yearFilter);
    return matchesSearch && matchesYear;
  });

  // 2. Sorting
  if (sortVal === 'pct-desc') {
    filtered.sort((a, b) => b.percentage - a.percentage);
  } else if (sortVal === 'pct-asc') {
    filtered.sort((a, b) => a.percentage - b.percentage);
  } else if (sortVal === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'name-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  }

  // 3. Display Toggle (Empty State check)
  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    table.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    table.style.display = 'table';
    
    filtered.forEach(student => {
      // Percentage badge class assignment
      let badgeClass = 'badge-red';
      if (student.percentage >= 75) badgeClass = 'badge-green';
      else if (student.percentage >= 50) badgeClass = 'badge-orange';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="student-meta">
            <span class="student-name-cell">${student.name}</span>
            <span>ID: ${student.id}</span>
          </div>
        </td>
        <td>${student.year}</td>
        <td>${student.english}</td>
        <td>${student.physics}</td>
        <td>${student.maths}</td>
        <td>${student.hindi}</td>
        <td><strong>${student.total}</strong></td>
        <td><span class="badge ${badgeClass}">${student.percentage.toFixed(2)}%</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit-btn" onclick="editStudent('${student.id}')" title="Edit Student">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete-btn" onclick="confirmDelete('${student.id}', '${student.name}')" title="Delete Student">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Global hook triggered from Inline onclick
window.editStudent = function(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  // Toggle Page content to edit student mode
  document.getElementById('editStudentId').value = student.id;
  document.getElementById('studentName').value = student.name;
  document.getElementById('studentId').value = student.id;
  document.getElementById('studentId').setAttribute('disabled', 'true'); // Lock ID field in edit mode
  document.getElementById('academicYear').value = student.year;
  
  document.getElementById('englishMarks').value = student.english;
  document.getElementById('physicsMarks').value = student.physics;
  document.getElementById('mathsMarks').value = student.maths;
  document.getElementById('hindiMarks').value = student.hindi;

  // Recalculate panel values dynamically
  calculateLiveResults();

  // Change title contents
  document.getElementById('formSectionTitle').innerHTML = `<i class="fa-solid fa-pen-to-square text-blue"></i> Edit Student Record: ${student.name}`;
  document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';

  // Navigate to Form
  document.getElementById('navAddStudent').click();
  showToast('Edit Mode Enabled', `Loaded results for ${student.name}.`, 'info');
};

// ==========================================
// Delete Confirmation Modal Management
// ==========================================
function setupModals() {
  const modal = document.getElementById('confirmDeleteModal');
  const closeBtn = document.getElementById('closeDeleteModalBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  const closeModal = () => {
    modal.classList.remove('active');
    deleteTargetId = null;
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  confirmBtn.addEventListener('click', () => {
    if (deleteTargetId) {
      const idx = students.findIndex(s => s.id === deleteTargetId);
      if (idx !== -1) {
        const deletedName = students[idx].name;
        students.splice(idx, 1);
        saveData();
        updateUI();
        showToast('Record Deleted', `Permanently removed record for ${deletedName}.`, 'warning');
      }
    }
    closeModal();
  });
}

window.confirmDelete = function(id, name) {
  deleteTargetId = id;
  const modal = document.getElementById('confirmDeleteModal');
  const targetText = document.getElementById('deleteTargetText');
  targetText.textContent = `${name} (ID: ${id})`;
  modal.classList.add('active');
};

// ==========================================
// Statistics & Analytics Calculations
// ==========================================
function updateStatistics() {
  const totalStudents = students.length;
  
  if (totalStudents === 0) {
    document.getElementById('statTotalStudents').textContent = '0';
    document.getElementById('statAveragePct').textContent = '0.0%';
    document.getElementById('statHighestPct').textContent = '0.0%';
    document.getElementById('statLowestPct').textContent = '0.0%';
    
    // Reset Spotlight
    document.getElementById('spotlightName').textContent = 'No Records Yet';
    document.getElementById('spotlightId').textContent = 'ID: N/A';
    document.getElementById('spotlightScore').textContent = '--%';
    document.getElementById('spotlightTotalMarks').textContent = '0';
    return;
  }
  
  // Sum calculations
  const totalPercentages = students.reduce((sum, s) => sum + s.percentage, 0);
  const avgPercentage = totalPercentages / totalStudents;
  
  const sortedByPct = [...students].sort((a, b) => b.percentage - a.percentage);
  const highestScore = sortedByPct[0].percentage;
  const lowestScore = sortedByPct[sortedByPct.length - 1].percentage;
  
  // Update UI Dashboard metrics
  document.getElementById('statTotalStudents').textContent = totalStudents;
  document.getElementById('statAveragePct').textContent = `${avgPercentage.toFixed(2)}%`;
  document.getElementById('statHighestPct').textContent = `${highestScore.toFixed(2)}%`;
  document.getElementById('statLowestPct').textContent = `${lowestScore.toFixed(2)}%`;
  
  // Spotlight card: Highlight highest performer
  const topScorer = sortedByPct[0];
  document.getElementById('spotlightName').textContent = topScorer.name;
  document.getElementById('spotlightId').textContent = `ID: ${topScorer.id}`;
  document.getElementById('spotlightScore').textContent = `${topScorer.percentage.toFixed(2)}%`;
  document.getElementById('spotlightTotalMarks').textContent = topScorer.total;
}

// ==========================================
// Chart.js Visualizations Setup
// ==========================================
function renderCharts() {
  const ctx = document.getElementById('performanceChart').getContext('2d');
  
  // Check active theme colors
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const titleColor = isDark ? '#f8fafc' : '#1e293b';

  // Calculate subject averages
  let avgEnglish = 0, avgPhysics = 0, avgMaths = 0, avgHindi = 0;
  let distinctionCount = 0, passCount = 0, failCount = 0;

  if (students.length > 0) {
    const sumEnglish = students.reduce((sum, s) => sum + s.english, 0);
    const sumPhysics = students.reduce((sum, s) => sum + s.physics, 0);
    const sumMaths = students.reduce((sum, s) => sum + s.maths, 0);
    const sumHindi = students.reduce((sum, s) => sum + s.hindi, 0);
    
    avgEnglish = sumEnglish / students.length;
    avgPhysics = sumPhysics / students.length;
    avgMaths = sumMaths / students.length;
    avgHindi = sumHindi / students.length;

    students.forEach(s => {
      if (s.percentage >= 75) distinctionCount++;
      else if (s.percentage >= 50) passCount++;
      else failCount++;
    });
  }

  // Destroy previous chart instance before recreating
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Draw chart
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['English', 'Physics', 'Mathematics', 'Hindi', 'Distinction (≥75%)', 'Pass (50%-74%)', 'Fail (<50%)'],
      datasets: [
        {
          label: 'Averages / Count Breakdown',
          data: [
            avgEnglish.toFixed(1), 
            avgPhysics.toFixed(1), 
            avgMaths.toFixed(1), 
            avgHindi.toFixed(1),
            distinctionCount,
            passCount,
            failCount
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.75)', // English - Blue
            'rgba(99, 102, 241, 0.75)', // Physics - Violet
            'rgba(168, 85, 247, 0.75)', // Maths - Purple
            'rgba(236, 72, 153, 0.75)', // Hindi - Pink
            'rgba(16, 185, 129, 0.75)',  // Green Distinction
            'rgba(249, 115, 22, 0.75)',  // Orange Pass
            'rgba(239, 68, 68, 0.75)'    // Red Fail
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(99, 102, 241)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
            'rgb(16, 185, 129)',
            'rgb(249, 115, 22)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide legend as it's a single series
        },
        tooltip: {
          padding: 12,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: titleColor,
          bodyColor: labelColor,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (context.dataIndex < 4) {
                return ` Avg Grade: ${value}%`;
              } else {
                return ` Students count: ${value}`;
              }
            }
          }
        }
      },
      scales: {
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: labelColor,
            font: { family: 'Outfit', size: 11 }
          },
          min: 0
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: labelColor,
            font: { family: 'Outfit', size: 10 }
          }
        }
      }
    }
  });
}

// ==========================================
// UI Sync Orchestration
// ==========================================
function updateUI() {
  updateStatistics();
  renderRecordsTable();
  renderCharts();
}

// ==========================================
// Toast Notifications Utilities
// ==========================================
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} glass-panel`;
  
  let iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-triangle-exclamation';
  if (type === 'warning') iconClass = 'fa-trash-can';
  if (type === 'info') iconClass = 'fa-circle-info';
  
  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <div>
      <div style="font-weight: 700; font-size: 0.9rem;">${title}</div>
      <div style="font-size: 0.75rem; opacity: 0.9;">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Slide out and remove toast after 3.5s
  setTimeout(() => {
    toast.style.animation = 'slideInRight var(--transition-fast) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// Exports: Excel (SheetJS) & PDF (jsPDF)
// ==========================================
function exportExcel() {
  if (students.length === 0) {
    showToast('Export Cancelled', 'No student records are available to export.', 'error');
    return;
  }
  
  // Format dataset specifically for tabular output
  const data = students.map(s => ({
    'Student Name': s.name,
    'Student ID': s.id,
    'Academic Year': s.year,
    'English Marks': s.english,
    'Physics Marks': s.physics,
    'Maths Marks': s.maths,
    'Hindi Marks': s.hindi,
    'Total Marks': s.total,
    'Percentage (%)': s.percentage
  }));
  
  // Run SheetJS processes
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Grades');
  
  // Trigger file download
  XLSX.writeFile(workbook, 'College_Student_Records.xlsx');
  showToast('Excel Exported', 'Downloaded records successfully as XLSX.', 'success');
}

function exportPdf() {
  if (students.length === 0) {
    showToast('Export Cancelled', 'No student records are available to export.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'pt', 'a4'); // landscape format to fit full list
  
  // PDF Styling Details
  doc.setFont('Outfit');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // deep slate
  doc.text('College Student Result Management System', 40, 40);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Student Records: ${students.length}`, 40, 58);
  
  // Build PDF AutoTable structure
  const headers = [['Student Name', 'Student ID', 'Year', 'English', 'Physics', 'Maths', 'Hindi', 'Total Marks', 'Percentage']];
  const tableData = students.map(s => [
    s.name,
    s.id,
    s.year,
    s.english,
    s.physics,
    s.maths,
    s.hindi,
    `${s.total} / 400`,
    `${s.percentage.toFixed(2)}%`
  ]);

  doc.autoTable({
    startY: 80,
    head: headers,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Primary Accent Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'center' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 8
    },
    margin: { left: 40, right: 40 }
  });
  
  // Trigger file download
  doc.save('College_Student_Records.pdf');
  showToast('PDF Exported', 'Downloaded results successfully as PDF.', 'success');
}
