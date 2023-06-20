/*
OVERVIEW

FEATURES
- displays contacts
- add contact
- edit contact
- delete contact
- search for contacts by name
- tagging feature
	- add tags to a contact

NOTES
- the add contact and edit contact forms are the same
- tags are stored as a comma separated list in the DB
- the display is either the form or contact list

ANIMATIONS
- on page start up
- adding contact
- canceling add contact
- submit new contact
- editing contact
- submiting/canceling edit contact
*/

const CONTACT_TEMPLATE = `
	<div class="contact-header">
		<h3 class="contact-name">{{contactName}}</h3>
	</div>
	<div class="contact-body">
		<dl class="contact-body-list">
			<dt>Phone Number:</dt>
			<dr>{{contactPhone}}</dr>
			<dt>Email:</dt>
			<dr>{{contactEmail}}</dr>
			<dt>Tags:</dt>
			<dr id="tag{{contactId}}">{{contactTags}}</dr>
		</dl>
	</div>
	<div class="contact-btn-wrapper">
		<a class="contact-btn edit-btn" data-contact-id="{{contactId}}">
			<img class="icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAwklEQVR4nO2TQQrCQAxF5wpSPIyYVKEX6CYR1Hs4khRdegE9jngJDyK4r4xlqNW6ambXD4HJ5v3/A+PcKOccoRwZ5ZQQrnUzCUwIdNcaGJoQVIv+FlqHfRgcI7BN22kCejCA60/a8B6Unr7gpnenv/BmVnNZJoOz5c15hCc/S1BZ+IxRL33wwb80imA/NYcT6Jbyahb3NfhJbGKSnFDOhPL4NCkLn5mdhVFu77SgT0bJTaBdA70TyDU0YZSNucEo16MXvi3lBvXhmd0AAAAASUVORK5CYII=">
			Edit
		</a>
		<a class="contact-btn delete-btn" data-contact-id="{{contactId}}">
			<img class="icon delete-btn" data-contact-id="{{contactId}}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAVklEQVR4nGNgGBEg1La6Icy25j8qru4gyzBMg2pIwgNvAQiQpJiBdPX0tyCMRP6oBQyjQcQwmopGYBARAoPSgidk1AVPiLYg1K7Gj0RLnoD0EG3BkAIALTpalYgNyGoAAAAASUVORK5CYII=">
			Delete
			</a>
	</div>
`;

const FORM_TEMPLATE = `
	<h3 class="form-title">{{formTitle}}</h3>
	<form id="contact-form">
		<label class="label-a" for="name">Full name:</label>
		<input class="input-a form-input" type="text" id="name" name="full_name">
		<label class="label-b" for="email">Email address:</label>
		<input class="input-b form-input" type="email" id="email" name="email">
		<label class="label-c" for="phone">Telephone number:</label>
		<input class="input-c form-input" type="phone" id="phone" name="phone_number">
		<label class="label-d" for="tags">Tags (optional):</label>
		<input class="input-d form-input tags" type="tags" name="tags">
		<div class="grid-btn-wrapper" id="btn-wrapper">
			<button id="{{submitButtonId}}" class="button submit-btn toggle-contact" type="submit">Submit</button>
			<div id="btn-spacer"></div>
			<div id="cancel-btn" class="button cancel-btn toggle-contact" type="submit">Cancel</div>
		</div>
	</form>
`;

const CREATE_CONTACT_FORM_DATA = {
	formTitle: 'Create Contact',
	submitButtonId: 'add-contact',
};

const UPDATE_CONTACT_FORM_DATA = {
	formTitle: 'Edit Contact',
	submitButtonId: 'edit-contact',
};

const ContactManagerProto = {

	async init() {
		this.contacts = await this.fetchAllContacts();
		this.tags = {};
		this.populateContactList();
		this.addHandlers();
	},

	addHandlers() {
		this.addToggleContactsHandler.call(this);
		this.addEditFormHandler.call(this);
		this.addDeleteContactHandler.call(this);
		this.addSearchHandler.call(this);
	},

	addToggleContactsHandler() {
		const addContactButtons = document.getElementsByClassName('toggle-contact');

		[...addContactButtons].forEach((button) => {
			button.addEventListener('click', () => {
				this.toggleContactWithForm();
			});
		});
	},

	addCancelFormHandler() {
		const cancelBtn = document.getElementById('cancel-btn');		
		cancelBtn.addEventListener('click', () => {
			this.toggleContactWithForm();
		});
	},

	addContactCreationHandler() {
		const form = document.getElementById('contact-form');
		
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const queryString = this.encodeFormData(form);
			this.createContact(queryString, form);
			this.clearForm(form);
			this.clearNoContactsContainer();
		});
	},

	addEditFormHandler() {
		const contactList = document.getElementById('contacts');
		
		contactList.addEventListener('click', (e) => {
			if (e.target.classList.contains('edit-btn')) {
				const contactId = e.target.dataset.contactId;
				this.toggleContactWithForm(UPDATE_CONTACT_FORM_DATA);
				this.loadEditForm(contactId);
				const updateBtn = document.getElementById('edit-contact');
				const form = document.getElementById('contact-form');
				
				updateBtn.addEventListener('click', () => {
					const queryString = this.encodeFormData(form);
					this.updateContact(queryString, contactId);
					this.clearForm(form);
				});
			}
		})
	},

	addDeleteContactHandler() {
		const contacts = document.getElementById('contacts');

		contacts.addEventListener('click', async (e) => {
			const contactId = e.target.dataset.contactId;
			if (contactId && e.target.classList.contains('delete-btn')) {
				let confirmed = confirm('Do you want to delete the contact?');
				if (confirmed) {
					const contactContainer = e.target.parentNode.parentNode;
					await this.deleteContact(contactId, contactContainer);
					if (this.contacts.length === 0) this.populateContactList();
				}
			}
		});
	},

	addSearchHandler() {
		const searchInput = document.getElementById('search');

		searchInput.addEventListener('input', (e) => {
			const searchValue = e.target.value;
			const filteredContacts = this.contacts.filter((contact) => {
				const contactNameSlice = contact.full_name.slice(0, searchValue.length).toLowerCase();
				const searchValueLowercase = searchValue.toLowerCase().trim();
				return contactNameSlice === searchValueLowercase;
			});

			this.populateContactList(filteredContacts);
		});
	},

	async loadEditForm(contactId) {
		const contactData = await this.fetchContact(contactId);
		const form = document.getElementById('contact-form');
		const inputs = form.getElementsByTagName('input');
		
		[...inputs].forEach((input) => {
			let value = contactData[input.name];
			if (!value) {
				return ''
			} else if (input.name === 'tags' && value.length > 0) {
				value = value.split(',').join(' ');
			}
			input.value = value;
		});
	},

	async fetchAllContacts() {
		try {
			const response = await fetch('http://localhost:3000/api/contacts');
			if (response.status === 200) {
				return await response.json();
			} else {
				console.log(response.status);
			}
		} catch (err) {
			console.log(err);
		}
	},

	async fetchContact(contactId) {
		try {
			const response = await fetch(`http://localhost:3000/api/contacts/${contactId}`);
			if (response.status === 200) {
				return await response.json();
			} else {
				console.log(response.status);
			}
		} catch (err) {
			console.log(err);
		}
	},

	async createContact(queryString) {
		try {
			const response = await fetch('http://localhost:3000/api/contacts/', {
				method: 'POST',
				body: queryString,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			if (response.status === 201) {
				const contactData = await response.json();
				this.contacts.push(contactData);
				this.displayContact(contactData);
				this.populateContactList();
				this.toggleContactWithForm()
			} else {
				console.log(response.status);
			}
		} catch (err) {
			console.log(err, err.stack);
		}
	},

	async updateContact(queryString, contactId) {
		try {
			const response = await fetch(`http://localhost:3000/api/contacts/${contactId}`, {
				method: 'PUT', 
				body: queryString,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			if (response.status != 201) {
				console.log(response.status);
			}
		} catch (err) {
			console.log(err);
		}
	},
	
	async deleteContact(contactId, contactContainer) {
		try {
			const response = await fetch(`http://localhost:3000/api/contacts/${contactId}`, {
				method: 'DELETE',
			});
			if (response.status === 204) {
				this.contacts = this.contacts.filter((contact) => contact.id != contactId);
				this.removeContactsFromTags(contactId);
				contactContainer.remove();
			} else {
				console.log(response.status);
			}
		} catch(err) {
			console.log(err);
		}
	},

	populateContactList(contactList=this.contacts) {
		const contactContainer = document.getElementById('contacts');
		contactContainer.innerHTML = '';

		if (contactList.length === 0) {
			this.displayWhenNoContacts();
		} else {
			contactList.forEach((contact) => {
				this.displayContact(contact);
			});
		}
	},

	linkTags(li, contact) {
		if (!contact.tags || contact.tags.length === 0) return;
		const contactBody = li.getElementsByClassName('contact-body-list')[0];
		const tagId = 'tag' + String(contact.id);
		const tagElement = document.getElementById(tagId);
		
		contact.tags.split(',').forEach((tag) => {
			const span = document.createElement('span');
			span.classList.add('tag-link');
			span.textContent = tag;
			span.dataset.tag = tag;

			if (this.tags[tag]) {
				let contactExists = this.tags[tag].some(currentContact => currentContact.id === contact.id);
				if (!contactExists) this.tags[tag].push(contact);
			}	else {
				this.tags[tag] = [contact];
			}

			tagElement.append(span, " ")

			span.addEventListener('click', (e) => {
				const targetTag = e.target.dataset.tag;
				const tagContacts = this.tags[targetTag];
				this.populateContactList(tagContacts);
			});

			contactBody.appendChild(tagElement);
		});
	},

	removeContactsFromTags(contactId) {
		const tagKeys = Object.keys(this.tags);
		tagKeys.forEach(key => {
			let filteredArray = this.tags[key].filter(contact => contact.id != contactId);
			this.tags[key] = filteredArray;
		});
	},

	displayContact(contact) {
		const list = document.getElementById('contacts');
		const template = Handlebars.compile(CONTACT_TEMPLATE);
		const contactData = {
			contactName: contact.full_name,
			contactPhone: contact.phone_number,
			contactEmail: contact.email,
			contactId: contact.id,
		};
		const html = template(contactData);
		const li = document.createElement('li');
		li.classList.add('contact-wrapper');
		li.innerHTML = html;
		list.appendChild(li);

		this.linkTags(li, contact);
	},

	displayWhenNoContacts() {
		const contactsContainer = document.getElementById('contacts');
		const div = document.createElement('div');
		const h3 = document.createElement('h3');
		const button = document.createElement('div');
		div.id = 'no-contacts-container';
		h3.id = 'no-contacts-title';
		button.id = 'no-contacts-button';
		h3.textContent = 'There are no contacts';
		button.textContent = 'Add Contact';
		div.appendChild(h3);
		div.appendChild(button);
		contactsContainer.appendChild(div);
		button.addEventListener('click', () => {
			this.toggleContactWithForm();
		});
	},

	clearForm(form) {
		const inputs = form.querySelectorAll('input');
		inputs.forEach((input) => {
			input.value = '';
		})
	},

	clearNoContactsContainer() {
		const noContactsContainer = document.getElementById('no-contacts-container');
		if (noContactsContainer) noContactsContainer.remove();
	},

	encodeFormData(form) {		
		const formData = new FormData(form);
		const names = ['full_name', 'email', 'phone_number', 'tags'];

		let values = names.map((paramName) => {
			let value = formData.get(paramName);
			if (!value) {
				return '';
			} else if (paramName === 'tags') {
				value = value.toLowerCase().split(' '). join(',');
			}
			return encodeURIComponent(value);
		});

		values = values.filter(value => value);

		const namesAndValues = values.reduce((array, value, index) => {
			array.push(names[index] + '=' + value);
			return array;
		}, []);

		const queryString = namesAndValues.join('&');
		return queryString;
	},

	toggleContactWithForm(formData=CREATE_CONTACT_FORM_DATA) {
		const contactDisplay = document.getElementById('contacts-wrapper');
		contactDisplay.classList.toggle('hidden');
		const newContactFormDisplay = document.getElementById('add-contact-wrapper');
		newContactFormDisplay.classList.toggle('hidden');
		newContactFormDisplay.classList.add('add-content-animation');
		const template = Handlebars.compile(FORM_TEMPLATE);
		const html = template(formData);
		newContactFormDisplay.innerHTML = html;

		if (!newContactFormDisplay.classList.contains('hidden')) {
			this.addCancelFormHandler.call(this);

			if (formData['formTitle'] === 'Create Contact') {
				this.addContactCreationHandler.call(this);
			}
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	Object.create(ContactManagerProto).init();
});
