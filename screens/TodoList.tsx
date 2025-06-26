import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { getAmplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';
// import { subscriptionManager } from '../lib/subscriptionManager'; // temporarily disabled

type Todo = Schema['Todo']['type'];

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const client = getAmplifyClient();
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });

    return () => subscription.unsubscribe();
  }, []);

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    const userId = session?.user?.id || null;

    try {
      console.log("Adding todo:", { content: newTodo, userId });
      
      const client = getAmplifyClient();
      const result = await client.models.Todo.create({
        content: newTodo,
        userId: userId,
      });
      
      console.log("Todo added:", result);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const deleteTodo = async (todo: Todo) => {
    try {
      console.log("Deleting todo:", todo.id);
      
      const client = getAmplifyClient();
      const result = await client.models.Todo.delete({
        id: todo.id,
      });
      
      console.log("Todo deleted:", result);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a new todo"
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <View style={styles.todoContent}>
              <Text style={styles.todoText}>
                {item.content}
              </Text>
              {item.userId && (
                <Text style={styles.userIdText}>
                  User: {item.userId}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTodo(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todoItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  userIdText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
});

export default TodoList;