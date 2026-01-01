// DOM Elements
const studentForm = document.getElementById('studentForm');
const fullNameInput = document.getElementById('fullName');
const gradeSelect = document.getElementById('grade');
const registrationDateInput = document.getElementById('registrationDate');
const paymentMonthsRadios = document.getElementsByName('paymentMonths');
const paymentStatusRadios = document.getElementsByName('paymentStatus');
const paymentAmountInput = document.getElementById('paymentAmount');
const genderSwitch = document.getElementById('genderSwitch');
const genderLabel = document.querySelector('.gender-label');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const filterPaymentStatus = document.getElementById('filterPaymentStatus');
const filterPaymentType = document.getElementById('filterPaymentType');
const filterMonth = document.getElementById('filterMonth');
const resetFiltersBtn = document.getElementById('resetFilters');
const printReportBtn = document.getElementById('printReport');
const statisticsBtn = document.getElementById('statisticsBtn');
const studentsTableBody = document.getElementById('studentsTableBody');
const noResults = document.getElementById('noResults');
const totalStudentsEl = document.getElementById('totalStudents');
const paidStudentsEl = document.getElementById('paidStudents');
const partialStudentsEl = document.getElementById('partialStudents');
const unpaidStudentsEl = document.getElementById('unpaidStudents');
const totalPaymentsEl = document.getElementById('totalPayments');
const confirmationModal = document.getElementById('confirmationModal');
const confirmModalBtn = document.getElementById('confirmModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeModalBtn = document.querySelector('.close-modal');
const toast = document.getElementById('toast');
const currentDateEl = document.getElementById('currentDate');
const currentYearEl = document.getElementById('currentYear');
const decrementBtn = document.getElementById('decrement-button');
const incrementBtn = document.getElementById('increment-button');

// State
let students = [];
let editingId = null;

// Load students from localStorage with error handling
function loadStudents() {
    try {
        const stored = localStorage.getItem('students');
        if (stored) {
            students = JSON.parse(stored);
            console.log('تم تحميل البيانات بنجاح:', students.length, 'طالب');
        } else {
            students = [];
            console.log('لا توجد بيانات محفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        students = [];
        showToast('حدث خطأ أثناء تحميل البيانات', 'error');
    }
}

// Initialize the app
function init() {
    // Check if all required elements exist
    if (!studentForm) {
        console.error('عنصر studentForm غير موجود');
        return;
    }
    
    if (!fullNameInput || !gradeSelect || !registrationDateInput) {
        console.error('بعض عناصر النموذج غير موجودة');
        return;
    }
    
    if (!studentsTableBody) {
        console.error('عنصر studentsTableBody غير موجود');
        return;
    }
    
    console.log('جميع العناصر موجودة، بدء التهيئة');
    
    // Load students first
    loadStudents();
    
    // Set current date with Arabic names
    const now = new Date();
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    const dayName = arabicDays[now.getDay()];
    const day = now.getDate();
    const monthName = arabicMonths[now.getMonth()];
    const year = now.getFullYear();
    
    const formattedDate = `${dayName}، ${day} ${monthName} ${year}`;
    if (currentDateEl) {
        currentDateEl.textContent = formattedDate;
    }
    
    // Set current year in footer
    if (currentYearEl) {
        currentYearEl.textContent = now.getFullYear();
    }
    
    // Set default registration date to today
    const today = now.toISOString().split('T')[0];
    registrationDateInput.value = today;
    
    // Set default filter month to current month
    if (filterMonth) {
        filterMonth.value = (now.getMonth() + 1).toString();
    }
    
    // Render students and update stats
    renderStudents();
    updateStats();
    
    // Add event listeners
    studentForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', resetForm);
    searchInput.addEventListener('input', filterStudents);
    filterPaymentStatus.addEventListener('change', filterStudents);
    filterPaymentType.addEventListener('change', filterStudents);
    filterMonth.addEventListener('change', filterStudents);
    resetFiltersBtn.addEventListener('click', resetFilters);
    printReportBtn.addEventListener('click', printReport);
    statisticsBtn.addEventListener('click', goToStatistics);
    confirmModalBtn.addEventListener('click', confirmDelete);
    cancelModalBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    genderSwitch.addEventListener('change', updateGenderLabel);
    
    // Quantity input event listeners
    decrementBtn.addEventListener('click', decrementAmount);
    incrementBtn.addEventListener('click', incrementAmount);
    paymentAmountInput.addEventListener('input', formatAmount);
    
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            closeModal();
        }
    });
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const fullName = fullNameInput.value.trim();
    const grade = gradeSelect.value;
    const registrationDate = registrationDateInput.value;
    const paymentMonthsSelected = document.querySelector('input[name="paymentMonths"]:checked');
    const paymentStatusValue = document.querySelector('input[name="paymentStatus"]:checked').value;
    // Remove commas and convert to number for payment amount
    const paymentAmount = parseFloat((paymentAmountInput.value || '0').replace(/,/g, '')) || 0;
    const gender = genderSwitch.checked ? 'female' : 'male';
    
    // Validate required fields
    if (!fullName) {
        showToast('يرجى إدخال اسم الطالب', 'error');
        fullNameInput.focus();
        return;
    }
    
    if (!grade) {
        showToast('يرجى اختيار الصف الدراسي', 'error');
        gradeSelect.focus();
        return;
    }
    
    if (!registrationDate) {
        showToast('يرجى اختيار تاريخ التسجيل', 'error');
        registrationDateInput.focus();
        return;
    }
    
    if (!paymentMonthsSelected) {
        showToast('يرجى اختيار عدد شهور الدفع', 'error');
        return;
    }
    
    if (paymentAmount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        paymentAmountInput.focus();
        return;
    }
    
    console.log('بيانات النموذج:', {
        fullName, grade, registrationDate, paymentStatusValue, paymentAmount, gender
    });
    
    // Get payment months text and calculate total
    let paymentMonthsText = 'غير محدد';
    let totalMonths = 0;
    
    if (paymentMonthsSelected && paymentMonthsSelected.id !== 'all') {
        const monthNumber = parseInt(paymentMonthsSelected.id.replace('option-', ''));
        totalMonths = monthNumber;
        paymentMonthsText = monthNumber === 1 ? 'شهر 1' : 
                           monthNumber === 2 ? 'شهرين 2' : 
                           `${monthNumber} شهور`;
    }
    
    // Calculate total payment (amount × months)
    const totalPayment = paymentAmount * totalMonths;
    
    console.log('بيانات الحساب:', {
        paymentAmount, totalMonths, totalPayment
    });
    
    const formData = {
        fullName,
        grade,
        registrationDate,
        paymentMonths: paymentMonthsSelected ? paymentMonthsSelected.id : 'all',
        paymentMonthsText,
        totalMonths,
        paymentAmount,
        totalPayment,
        paymentStatusValue,
        gender,
        id: editingId || Date.now().toString(),
        lastUpdated: new Date().toISOString()
    };
    
    console.log('بيانات الطالب الكاملة:', formData);
    
    if (editingId) {
        // Update existing student
        const index = students.findIndex(s => s.id === editingId);
        if (index !== -1) {
            students[index] = formData;
            console.log('تحديث الطالب:', formData);
            if (saveStudents()) {
                showToast('تم تحديث بيانات الطالب بنجاح', 'success');
            }
        } else {
            showToast('لم يتم العثور على الطالب للتحديث', 'error');
        }
    } else {
        // Add new student
        students.push(formData);
        console.log('إضافة طالب جديد:', formData);
        console.log('إجمالي الطلبة بعد الإضافة:', students.length);
        if (saveStudents()) {
            showToast('تم إضافة الطالب بنجاح', 'success');
        }
    }
    
    renderStudents();
    updateStats();
    resetForm();
}

// Reset form
function resetForm() {
    studentForm.reset();
    editingId = null;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
    cancelBtn.style.display = 'none';
    document.getElementById('paid').checked = true;
}

// Save students to localStorage
function saveStudents() {
    try {
        // Check if data is too large
        const dataSize = JSON.stringify(students).length;
        if (dataSize > 5000000) { // 5MB limit
            console.error('البيانات كبيرة جداً:', dataSize, 'bytes');
            showToast('البيانات كبيرة جداً، يرجى حذف بعض السجلات', 'error');
            return false;
        }
        
        localStorage.setItem('students', JSON.stringify(students));
        console.log('تم حفظ البيانات بنجاح:', students.length, 'طالب', 'الحجم:', dataSize, 'bytes');
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        
        if (error.name === 'QuotaExceededError') {
            showToast('مساحة التخزين ممتلئة، يرجى حذف بعض البيانات', 'error');
        } else {
            showToast('حدث خطأ أثناء حفظ البيانات', 'error');
        }
        return false;
    }
}

// Render students table
function renderStudents(filteredStudents = null) {
    const studentsToRender = filteredStudents || students;
    
    if (studentsToRender.length === 0) {
        studentsTableBody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    const rows = studentsToRender.map((student, index) => {
        // Get payment status text and badge class
        let paymentStatusText = 'لم يدفع';
        let paymentStatusClass = 'unpaid-badge';
        
        if (student.paymentStatusValue === 'paid') {
            paymentStatusText = 'دفع كامل';
            paymentStatusClass = 'paid-badge';
        } else if (student.paymentStatusValue === 'partial') {
            paymentStatusText = 'دفع جزئي';
            paymentStatusClass = 'partial-badge';
        }
        
        // Get button class and icon
        let buttonClass = 'paid';
        let buttonIcon = 'fa-check-circle';
        let buttonTitle = 'تغيير الحالة إلى مدفوع';
        
        if (student.paymentStatusValue === 'paid') {
            buttonClass = 'unpaid';
            buttonIcon = 'fa-times-circle';
            buttonTitle = 'تغيير الحالة إلى غير مدفوع';
        }
        
        // Calculate total payment display
        const totalPayment = student.totalPayment || 0;
        const totalPaymentDisplay = totalPayment > 0 ? 
            totalPayment.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
        
        return `
        <tr>
            <td class="number">${(index + 1).toLocaleString('en-US')}</td>
            <td>${student.fullName}</td>
            <td>${student.grade}</td>
            <td>
                <span class="gender-badge ${student.gender}">
                    ${student.gender === 'male' ? '♂' : '♀'}
                </span>
            </td>
            <td>${formatDate(student.registrationDate)}</td>
            <td>${student.paymentMonthsText || 'غير محدد'}</td>
            <td class="amount">${student.paymentAmount ? student.paymentAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
            <td class="amount total-payment">${totalPaymentDisplay}</td>
            <td>
                <span class="payment-status ${paymentStatusClass}">
                    ${paymentStatusText}
                </span>
            </td>
            <td>${formatDate(student.lastUpdated, true)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" data-id="${student.id}" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${student.id}" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn ${buttonClass}" 
                            data-id="${student.id}" 
                            title="${buttonTitle}">
                        <i class="fas ${buttonIcon}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    
    studentsTableBody.innerHTML = rows;
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => editStudent(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', () => showDeleteConfirmation(btn.dataset.id));
    });
    
    document.querySelectorAll('.paid, .unpaid').forEach(btn => {
        btn.addEventListener('click', () => togglePaymentStatus(btn.dataset.id));
    });
}

// Edit student
function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    editingId = id;
    fullNameInput.value = student.fullName;
    gradeSelect.value = student.grade;
    registrationDateInput.value = student.registrationDate;
    
    // Set payment months radio button
    if (student.paymentMonths) {
        document.getElementById(student.paymentMonths).checked = true;
    } else {
        // Default to 'all' for old data
        document.getElementById('all').checked = true;
    }
    
    // Set payment status radio button
    if (student.paymentStatusValue) {
        document.getElementById(student.paymentStatusValue).checked = true;
    } else {
        // Default to unpaid for old data
        document.getElementById('unpaid').checked = true;
    }
    
    // Format payment amount with commas for display
    if (student.paymentAmount) {
        const parts = student.paymentAmount.toFixed(2).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        paymentAmountInput.value = integerPart + '.' + parts[1];
    } else {
        paymentAmountInput.value = '';
    }
    
    genderSwitch.checked = student.gender === 'female';
    updateGenderLabel();
    
    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التغييرات';
    cancelBtn.style.display = 'inline-flex';
    
    // Scroll to form
    studentForm.scrollIntoView({ behavior: 'smooth' });
    fullNameInput.focus();
}

// Update gender label
function updateGenderLabel() {
    genderLabel.textContent = genderSwitch.checked ? 'أنثى' : 'ذكر';
}

// Toggle payment status
function togglePaymentStatus(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    // Cycle through payment statuses: unpaid -> partial -> paid -> unpaid
    if (!student.paymentStatusValue || student.paymentStatusValue === 'unpaid') {
        student.paymentStatusValue = 'partial';
    } else if (student.paymentStatusValue === 'partial') {
        student.paymentStatusValue = 'paid';
    } else {
        student.paymentStatusValue = 'unpaid';
    }
    
    student.lastUpdated = new Date().toISOString();
    
    saveStudents();
    renderStudents();
    updateStats();
    
    const statusText = student.paymentStatusValue === 'paid' ? 'دفع كامل' : 
                      student.paymentStatusValue === 'partial' ? 'دفع جزئي' : 'لم يدفع';
    
    showToast(
        `تم تغيير حالة الدفع إلى ${statusText}`,
        'success'
    );
}

// Show delete confirmation modal
function showDeleteConfirmation(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    document.getElementById('modalTitle').textContent = 'تأكيد الحذف';
    document.getElementById('modalMessage').textContent = `هل أنت متأكد من حذف الطالب "${student.fullName}"؟ لا يمكن التراجع عن هذه العملية.`;
    confirmModalBtn.dataset.id = id;
    
    confirmationModal.style.display = 'flex';
}

// Confirm delete
function confirmDelete() {
    const id = confirmModalBtn.dataset.id;
    const student = students.find(s => s.id === id);
    
    if (student) {
        students = students.filter(s => s.id !== id);
        if (saveStudents()) {
            renderStudents();
            updateStats();
            showToast('تم حذف الطالب بنجاح', 'success');
        }
    }
    
    closeModal();
}

// Close modal
function closeModal() {
    confirmationModal.style.display = 'none';
    delete confirmModalBtn.dataset.id;
}

// Filter students
function filterStudents() {
    const searchTerm = searchInput.value.toLowerCase();
    const paymentStatusFilter = filterPaymentStatus.value;
    const paymentTypeFilter = filterPaymentType.value;
    const monthFilter = filterMonth.value;
    
    const filtered = students.filter(student => {
        // Search by name or grade
        const matchesSearch = student.fullName.toLowerCase().includes(searchTerm) || 
                            student.grade.includes(searchTerm);
        
        // Filter by payment status
        const matchesPaymentStatus = paymentStatusFilter === 'all' || 
                                   (paymentStatusFilter === 'paid' && student.paymentStatusValue === 'paid') ||
                                   (paymentStatusFilter === 'partial' && student.paymentStatusValue === 'partial') ||
                                   (paymentStatusFilter === 'unpaid' && student.paymentStatusValue === 'unpaid');
        
        // Filter by payment type (based on total months)
        let matchesPaymentType = true;
        if (paymentTypeFilter !== 'all') {
            if (paymentTypeFilter === 'شهري' && student.totalMonths === 1) {
                matchesPaymentType = true;
            } else if (paymentTypeFilter === 'سنوي' && student.totalMonths >= 10) {
                matchesPaymentType = true;
            } else if (paymentTypeFilter === 'شهري' && student.totalMonths > 1 && student.totalMonths < 10) {
                matchesPaymentType = true;
            } else {
                matchesPaymentType = false;
            }
        }
        
        // Filter by month
        let matchesMonth = true;
        if (monthFilter !== 'all') {
            const date = new Date(student.registrationDate);
            const month = (date.getMonth() + 1).toString();
            matchesMonth = month === monthFilter;
        }
        
        return matchesSearch && matchesPaymentStatus && matchesPaymentType && matchesMonth;
    });
    
    renderStudents(filtered);
}

// Reset filters
function resetFilters() {
    searchInput.value = '';
    filterPaymentStatus.value = 'all';
    filterPaymentType.value = 'all';
    filterMonth.value = (new Date().getMonth() + 1).toString();
    renderStudents(students);
}

// Update statistics
function updateStats() {
    // Check if statistics elements exist
    if (!totalStudentsEl || !paidStudentsEl || !partialStudentsEl || !unpaidStudentsEl || !totalPaymentsEl) {
        console.error('بعض عناصر الإحصائيات غير موجودة');
        return;
    }
    
    const totalStudents = students.length;
    const paidStudents = students.filter(s => s.paymentStatusValue === 'paid').length;
    const partialStudents = students.filter(s => s.paymentStatusValue === 'partial').length;
    const unpaidStudents = students.filter(s => s.paymentStatusValue === 'unpaid').length;
    
    // Calculate total payments (amount × months for all students)
    const totalPayments = students.reduce((sum, student) => {
        return sum + (student.totalPayment || 0);
    }, 0);
    
    console.log('تحديث الإحصائيات:', {
        totalStudents, paidStudents, partialStudents, unpaidStudents, totalPayments
    });
    
    totalStudentsEl.textContent = totalStudents.toLocaleString('en-US');
    paidStudentsEl.textContent = paidStudents.toLocaleString('en-US');
    partialStudentsEl.textContent = partialStudents.toLocaleString('en-US');
    unpaidStudentsEl.textContent = unpaidStudents.toLocaleString('en-US');
    totalPaymentsEl.textContent = totalPayments.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Format date with English numbers
function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    
    // أسماء الأشهر والأيام بالعربية
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    const dayName = arabicDays[date.getDay()];
    
    if (includeTime) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${dayName}، ${day} ${month} ${year} - ${hours}:${minutes}`;
    }
    
    return `${day}/${date.getMonth() + 1}/${year}`;
}

// Print report
function printReport() {
    window.print();
}

// Show toast notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Quantity input functions
function decrementAmount() {
    // Remove commas and convert to number
    const currentValue = parseFloat((paymentAmountInput.value || '0').replace(/,/g, '')) || 0;
    const newValue = Math.max(0, currentValue - 10);
    
    // Format with commas
    const parts = newValue.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    paymentAmountInput.value = integerPart + '.' + parts[1];
}

function incrementAmount() {
    // Remove commas and convert to number
    const currentValue = parseFloat((paymentAmountInput.value || '0').replace(/,/g, '')) || 0;
    const newValue = currentValue + 10;
    
    // Format with commas
    const parts = newValue.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    paymentAmountInput.value = integerPart + '.' + parts[1];
}

function formatAmount(e) {
    let value = e.target.value;
    
    // Remove non-English numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Ensure value is not negative
    if (parseFloat(value) < 0) {
        value = '0';
    }
    
    // Format with comma separators for thousands
    if (parts[0]) {
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length === 2) {
            value = integerPart + '.' + parts[1];
        } else {
            value = integerPart;
        }
    }
    
    e.target.value = value;
}

// Function to go to statistics page
function goToStatistics() {
    window.location.href = 'statistics.html';
}

// Clear all data
function clearAllData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        try {
            localStorage.removeItem('students');
            students = [];
            renderStudents();
            updateStats();
            showToast('تم مسح جميع البيانات بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في مسح البيانات:', error);
            showToast('حدث خطأ أثناء مسح البيانات', 'error');
        }
    }
}

// Export data to JSON
function exportData() {
    try {
        const dataStr = JSON.stringify(students, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `students_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
