---
title: Events
menuTitle: Events
weight: 35
description: ''
---
{{< warning >}}
Spring Data ArangoDB version 3 reached End of Life (EOL) and is not actively
developed anymore. Upgrading to version 4 is recommended.
{{< /warning >}}

Spring Data ArangoDB includes several `ApplicationEvent` events that your
application can respond to by registering subclasses of
`AbstractArangoEventListener` in the ApplicationContext.

The following callback methods are present in `AbstractArangoEventListener`:

- `onAfterLoad`: Called in `ArangoTemplate#find` and `ArangoTemplate#query` after the object is loaded from the database.
- `onBeforeSave`: Called in `ArangoTemplate#insert`/`#update`/`#replace` before the object is converted and send to the database.
- `onAfterSave`: Called in `ArangoTemplate#insert`/`#update`/`#replace` after the object is send to the database.
- `onBeforeDelete`: Called in `ArangoTemplate#delete` before the object is converted and send to the database.
- `onAfterDelete`: Called in `ArangoTemplate#delete` after the object is deleted from the database.

**Examples**

```java
package my.mapping.events;

public class BeforePersonSavedListener extends AbstractArangoEventListener<Person> {

  @Override
  public void onBeforeSave(BeforeSaveEvent<Person> event) {
    // do some logging or data manipulation
  }

}
```

To register the listener add `@ComponentScan` with the package of your listener
to your configuration class.

```java
@Configuration
@ComponentScan("my.mapping.events")
public class MyConfiguration implements ArangoConfiguration {
  ...
```
