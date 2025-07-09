document.addEventListener('DOMContentLoaded', function() {
  // Global state
  let isEditMode = false;
  let siteData = null;
  
  // DOM Elements
  const adminPassword = document.getElementById('admin-password');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const bookingForm = document.getElementById('booking-form');
  const bookingConfirmation = document.getElementById('booking-confirmation');
  const subjectModal = document.getElementById('subject-modal');
  const subjectForm = document.getElementById('subject-form');
  const closeModal = document.querySelector('.close-modal');
  const cancelSubject = document.getElementById('cancel-subject');
  const subjectControls = document.querySelectorAll('.subject-controls');
  const addSchoolSubject = document.getElementById('add-school-subject');
  const addUniversitySubject = document.getElementById('add-university-subject');
  
  // Set hero image
  function setHeroBackgroundImage(url) {
    document.getElementById('hero-image').style.backgroundImage = `url('${url}')`;
  }
  
  // Fetch all data from API
  async function fetchData() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      siteData = data;
      renderContent(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  
  // Render content from API data
  function renderContent(data) {
    // Render sections content
    data.sections.forEach(item => {
      const element = document.getElementById(`${item.section}-${item.field}`);
      if (element) {
        if (item.field.includes('image')) {
          if (item.field === 'hero_image') {
            setHeroBackgroundImage(item.content);
          } else {
            element.src = item.content;
          }
        } else {
          element.textContent = item.content;
        }
      }
    });
    
    // Render subject lists
    renderSubjects(data.subjects);
  }
  
  // Render subjects by category
  function renderSubjects(subjects) {
    const schoolSubjects = subjects.filter(subject => subject.category === 'school');
    const universitySubjects = subjects.filter(subject => subject.category === 'university');
    
    const schoolContainer = document.getElementById('school-subjects-container');
    const universityContainer = document.getElementById('university-subjects-container');
    
    schoolContainer.innerHTML = '';
    universityContainer.innerHTML = '';
    
    schoolSubjects.forEach(subject => {
      schoolContainer.appendChild(createSubjectCard(subject));
    });
    
    universitySubjects.forEach(subject => {
      universityContainer.appendChild(createSubjectCard(subject));
    });
  }
  
  // Create subject card element
  function createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.dataset.id = subject.id;
    
    const title = document.createElement('h3');
    title.textContent = subject.name;
    
    const description = document.createElement('p');
    description.textContent = subject.description;
    
    const actions = document.createElement('div');
    actions.className = 'subject-card-actions';
    
    if (isEditMode) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn secondary-btn card-btn edit-subject';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openEditSubjectModal(subject));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn secondary-btn card-btn delete-subject';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteSubject(subject.id));
      
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    }
    
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(actions);
    
    return card;
  }
  
  // Admin login
  loginBtn.addEventListener('click', async function() {
    const password = adminPassword.value;
    if (password) {
      try {
        const response = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkPassword: true, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          enableEditMode();
          adminPassword.value = '';
        } else {
          alert('Incorrect password');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    }
  });
  
  // Admin logout
  logoutBtn.addEventListener('click', function() {
    disableEditMode();
  });
  
  // Enable edit mode
  function enableEditMode() {
    isEditMode = true;
    
    // Show logout button, hide login elements
    loginBtn.style.display = 'none';
    adminPassword.style.display = 'none';
    logoutBtn.style.display = 'block';
    
    // Show subject controls
    subjectControls.forEach(control => {
      control.style.display = 'block';
    });
    
    // Make content editable
    makeContentEditable(true);
    
    // Refresh subjects to add edit buttons
    renderSubjects(siteData.subjects);
  }
  
  // Disable edit mode
  function disableEditMode() {
    isEditMode = false;
    
    // Show login elements, hide logout button
    loginBtn.style.display = 'block';
    adminPassword.style.display = 'block';
    logoutBtn.style.display = 'none';
    
    // Hide subject controls
    subjectControls.forEach(control => {
      control.style.display = 'none';
    });
    
    // Make content not editable
    makeContentEditable(false);
    
    // Refresh subjects to remove edit buttons
    renderSubjects(siteData.subjects);
  }
  
  // Make content editable
  function makeContentEditable(editable) {
    const editableElements = [
      document.getElementById('home-title'),
      document.getElementById('home-subtitle'),
      document.getElementById('about-bio'),
      document.getElementById('contact-address'),
      document.getElementById('contact-phone'),
      document.getElementById('contact-email')
    ];
    
    editableElements.forEach(element => {
      if (element) {
        element.contentEditable = editable;
        
        if (editable) {
          element.addEventListener('blur', updateSectionContent);
        } else {
          element.removeEventListener('blur', updateSectionContent);
        }
      }
    });
    
    // Make images clickable for URL change
    const editableImages = [
      { id: 'hero-image', section: 'home', field: 'hero_image' },
      { id: 'about-image', section: 'about', field: 'image' }
    ];
    
    editableImages.forEach(img => {
      const element = document.getElementById(img.id);
      if (element) {
        if (editable) {
          element.style.cursor = 'pointer';
          element.addEventListener('click', () => promptImageChange(img.section, img.field, element));
        } else {
          element.style.cursor = '';
          element.removeEventListener('click', () => promptImageChange(img.section, img.field, element));
        }
      }
    });
  }
  
  // Update section content on edit
  async function updateSectionContent(event) {
    const element = event.target;
    const id = element.id;
    let section, field;
    
    if (id.includes('-')) {
      [section, field] = id.split('-');
    }
    
    if (section && field) {
      const content = element.textContent;
      
      try {
        const response = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, field, content })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update content');
        }
        
        // Update local data
        const sectionIndex = siteData.sections.findIndex(
          item => item.section === section && item.field === field
        );
        
        if (sectionIndex !== -1) {
          siteData.sections[sectionIndex].content = content;
        }
      } catch (error) {
        console.error('Error updating content:', error);
        alert('Failed to save changes. Please try again.');
        // Revert to original content
        fetchData();
      }
    }
  }
  
  // Prompt for image URL change
  function promptImageChange(section, field, element) {
    const currentUrl = field === 'hero_image' 
      ? getBackgroundImageUrl(element)
      : element.src;
      
    const newUrl = prompt('Enter new image URL:', currentUrl);
    
    if (newUrl && newUrl !== currentUrl) {
      updateImageUrl(section, field, newUrl, element);
    }
  }
  
  // Extract background image URL
  function getBackgroundImageUrl(element) {
    const style = window.getComputedStyle(element);
    const url = style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
    return url ? url[1] : '';
  }
  
  // Update image URL in database
  async function updateImageUrl(section, field, url, element) {
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, field, content: url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update image');
      }
      
      // Update UI
      if (field === 'hero_image') {
        setHeroBackgroundImage(url);
      } else {
        element.src = url;
      }
      
      // Update local data
      const sectionIndex = siteData.sections.findIndex(
        item => item.section === section && item.field === field
      );
      
      if (sectionIndex !== -1) {
        siteData.sections[sectionIndex].content = url;
      }
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Failed to update image. Please try again.');
    }
  }
  
  // Subject CRUD Operations
  addSchoolSubject.addEventListener('click', () => openAddSubjectModal('school'));
  addUniversitySubject.addEventListener('click', () => openAddSubjectModal('university'));
  
  // Open modal to add a new subject
  function openAddSubjectModal(category) {
    document.getElementById('subject-modal-title').textContent = `Add New ${category === 'school' ? 'School' : 'University'} Subject`;
    document.getElementById('subject-action').value = 'add';
    document.getElementById('subject-category').value = category;
    document.getElementById('subject-id').value = '';
    document.getElementById('subject-name').value = '';
    document.getElementById('subject-description').value = '';
    
    subjectModal.style.display = 'block';
  }
  
  // Open modal to edit a subject
  function openEditSubjectModal(subject) {
    document.getElementById('subject-modal-title').textContent = 'Edit Subject';
    document.getElementById('subject-action').value = 'edit';
    document.getElementById('subject-category').value = subject.category;
    document.getElementById('subject-id').value = subject.id;
    document.getElementById('subject-name').value = subject.name;
    document.getElementById('subject-description').value = subject.description;
    
    subjectModal.style.display = 'block';
  }
  
  // Close the subject modal
  function closeSubjectModal() {
    subjectModal.style.display = 'none';
  }
  
  closeModal.addEventListener('click', closeSubjectModal);
  cancelSubject.addEventListener('click', closeSubjectModal);
  
  // Handle subject form submission
  subjectForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const action = document.getElementById('subject-action').value;
    const id = document.getElementById('subject-id').value;
    const category = document.getElementById('subject-category').value;
    const name = document.getElementById('subject-name').value;
    const description = document.getElementById('subject-description').value;
    
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, category, name, description })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subject');
      }
      
      // Refresh data
      await fetchData();
      closeSubjectModal();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject. Please try again.');
    }
  });
  
  // Delete a subject
  async function deleteSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        const response = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete subject');
        }
        
        // Refresh data
        await fetchData();
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject. Please try again.');
      }
    }
  }
  
  // Handle booking form submission
  bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const message = document.getElementById('message').value;
    
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date, time, message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit booking');
      }
      
      // Show confirmation
      bookingForm.style.display = 'none';
      bookingConfirmation.classList.remove('hidden');
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking request. Please try again.');
    }
  });
  
  // Initialize the page
  fetchData();
});
