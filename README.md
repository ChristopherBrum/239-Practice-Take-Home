# 239 Practice Take Home

A simple frontend take-home application built with vanilla JavaScript

## Features to Implement

- page loading animation: "main" eomponent has drop-down animation

- the "menu" has:
	- an "add contact" button
	- a search bar

- "add contact" button
	- clicking "add contact" results in a "drop-up" with a form
	- once submitting the form "drops-down"

- search functionality
	
- list of contacts
	- When there are zero contacts: 
		- displays "There is no contacts" message 
		- "add contact" button that "drops-up" like the search function
	- When there are contacts
		- each contact will have their name, number and email
		- a button to open the edit contact info (with current info filled in)
		- delete button to delete contact

- "tagging" feature: 
	- allows you to create tags
	- when adding/editing a contant you can attach a tag
	- clicking on a tag will display all contatcs with that tag
- use API to store and fetch contacts from

## Flow of Execution

1. On load
	- pull all contacts
		- animation to display all contacts or display no contacts message
	
