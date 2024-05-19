# App Permissions
App permissions do not support the read/write/* ending

| Permission                       | Description                                  |
|----------------------------------|----------------------------------------------|
| app.web.login                    | Login/stay logged in                         |
| app.web.logout                   | Logout                                       |

# Permissions
All those permissions are from the point of the user performing the actions.
## User Permissions

| Permission                       | Description                                  |
|----------------------------------|----------------------------------------------|
| web.user.layout.write            | Set your own layout                          |
| web.user.language.write          | Set your own language                        |
| web.user.password.write          | Set your own password                        |
| web.user.settings.read           | See your own settings                        |
| web.user.username.write          | Set your own username                        |
| web.user.email.write             | Set your own email                           |
| web.user.firstname.write         | Set your own first name                      |
| web.user.lastname.write          | Set your own last name                       |
| web.user.bio.write               | Set your own biography                       |
| web.user.public.write            | Set your own privacy                         |
| web.user.avatar.write            | Set your own avatar                          |
| web.user.links.write             | Set your own socialmedia links               |
| web.user.links.read              | Read your own socialmedia links              |
| web.user.links.delete            | Delete your own socialmedia links            |

## Event Permissions

| Permission                       | Description                                  |
|----------------------------------|----------------------------------------------|
| web.event.get.count.read         | Read event count                             |
| web.event.get.events.read        | Read events                                  |
| web.event.get.event.read         | Read a single event                          |
| web.event.create.event.write     | Create a new event                           |
| web.event.join.event.write       | Join an event                                |
| web.event.leave.event.read       | Leave an event                               |
| web.event.update.event.write     | Update event details                         |

### Detailed Descriptions

- **web.event.get.count.read**: Allows reading the total count of events.
- **web.event.get.events.read**: Allows reading a paginated list of events.
- **web.event.get.event.read**: Allows reading details of a specific event.
- **web.event.create.event.write**: Allows creating new events with all necessary details.
- **web.event.join.event.write**: Allows a user to join an event.
- **web.event.leave.event.read**: Allows a user to leave an event.
- **web.event.update.event.write**: Allows updating event details such as name, color, min group, visibility, and various dates (apply, start, end).
