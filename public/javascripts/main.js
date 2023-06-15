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
		<dl>
			<dt>Phone Number:</dt>
			<dr>{{contactPhone}}</dr>
			<dt>Email:</dt>
			<dr>{{contactEmail}}</dr>
			<dt>Tags:</dt>
			<dr>{{contactTags}}</dr>
		</dl>
	</div>
	<div class="contact-btn-wrapper">
		<a class="contact-btn edit-btn" data-contact-id="{{contactId}}">
			<img class="icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAwklEQVR4nO2TQQrCQAxF5wpSPIyYVKEX6CYR1Hs4khRdegE9jngJDyK4r4xlqNW6ambXD4HJ5v3/A+PcKOccoRwZ5ZQQrnUzCUwIdNcaGJoQVIv+FlqHfRgcI7BN22kCejCA60/a8B6Unr7gpnenv/BmVnNZJoOz5c15hCc/S1BZ+IxRL33wwb80imA/NYcT6Jbyahb3NfhJbGKSnFDOhPL4NCkLn5mdhVFu77SgT0bJTaBdA70TyDU0YZSNucEo16MXvi3lBvXhmd0AAAAASUVORK5CYII=">
			Edit
		</a>
		<a class="contact-btn delete-btn" data-contact-id="{{contactId}}">
			<img class="icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAVklEQVR4nGNgGBEg1La6Icy25j8qru4gyzBMg2pIwgNvAQiQpJiBdPX0tyCMRP6oBQyjQcQwmopGYBARAoPSgidk1AVPiLYg1K7Gj0RLnoD0EG3BkAIALTpalYgNyGoAAAAASUVORK5CYII=">
			Delete
			</a>
	</div>
`;

const ContactManagerProto =  {

	async init() {
		this.contacts = await this.fetchAllContacts();
		this.populateContactList();
		this.addHandlers();
	},

	addHandlers() {
		this.addToggleContactsHandler.call(this);
		this.addContactCreationHandler.call(this);
		this.addEditContactHandler.call(this);
	},

	addToggleContactsHandler() {
		const addContactButtons = document.getElementsByClassName('toggle-contact');

		[...addContactButtons].forEach((button) => {
			button.addEventListener('click', (e) => {
				this.toggleContactWithForm('Create Contact');
			});
		});
	},

	addContactCreationHandler() {
		const form = document.getElementById('add-contact-form');
		
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			formData = new FormData(form);
			const names = ['full_name', 'email', 'phone_number', 'tags'];
			const values = names.map((paramName) => {
				let value = formData.get(paramName)
				if (paramName === 'tags') {
					value = value.toLowerCase().split(' '). join(',');
				}
				return value;
			});

			const namesAndValues = names.reduce((array, name, index) => {
				array.push(name + '=' + values[index]);
				return array;
			}, []);

			const queryString = namesAndValues.join('&');
			this.createContact(queryString, form);
		});
	},

	addEditContactHandler() {
		const contactList = document.getElementById('contacts');
		
		contactList.addEventListener('click', async (e) => {
			if (e.target.classList.contains('edit-btn')) {
				this.toggleContactWithForm('Edit Contact');

				console.log(e.target.dataset.contactId)
				// fetch contacts data
				// fill the forn with this data
			}
		})
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

	clearForm(form) {
		const inputs = form.querySelectorAll('input');
		inputs.forEach((input) => {
			input.value = '';
		})
	},

	async createContact(queryString, form) {
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
				this.clearForm(form);
				this.displayContact(contactData);
			} else {
				console.log(response.status);
			}
		} catch (err) {
			console.log(err);
		}
	},

	populateContactList() {
		if (this.contacts.length === 0) {
			// create UI for no contacts
		} else {
			this.contacts.forEach((contact) => {
				this.displayContact(contact);
			});
		}
	},

	displayContact(contact) {
		const list = document.getElementById('contacts');
		const template = Handlebars.compile(CONTACT_TEMPLATE);
		const contactData = {
			contactName: contact.full_name,
			contactPhone: contact.phone_number,
			contactEmail: contact.email,
			contactTags: contact.tags,
			contactId: contact.id,
		};
		const html = template(contactData);
		const li = document.createElement('li');
		li.classList.add('contact-wrapper');
		li.innerHTML = html;
		list.appendChild(li);
	},

	toggleContactWithForm(title) {
		const contactDisplay = document.getElementById('contacts-wrapper');
		contactDisplay.classList.toggle('hidden');
		const newContactFormDisplay = document.getElementById('add-contact-wrapper');
		newContactFormDisplay.classList.toggle('hidden');
		const formTitle = document.querySelector('.form-title');
		formTitle.textContent = title;
	}

}

document.addEventListener('DOMContentLoaded', () => {
	const contactManager = Object.create(ContactManagerProto).init();
});