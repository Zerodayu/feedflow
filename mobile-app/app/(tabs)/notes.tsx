import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import React, { useState } from 'react';
import { useNotes } from '@/contexts/DBprovider';
import type { NotesType } from '@/database/db-schema';
import { mainColors } from '@/utils/global-theme';
import { Trash, Pencil } from 'lucide-react-native';

export default function Notes() {
  const { notes, createNote, updateNote, deleteNote, refreshNotes } = useNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<NotesType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    fish_count: '',
    temperature: '',
    observation: '',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotes();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      fish_count: '',
      temperature: '',
      observation: '',
    });
    setEditingNote(null);
  };

  const handleOpenModal = (note?: NotesType) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        fish_count: note.fish_count.toString(),
        temperature: note.temperature.toString(),
        observation: note.observation,
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.fish_count || !formData.temperature) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const noteData = {
      title: formData.title,
      fish_count: parseInt(formData.fish_count),
      temperature: parseFloat(formData.temperature),
      observation: formData.observation,
    };

    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await createNote(noteData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNote(id),
        },
      ]
    );
  };

  const renderNoteItem = ({ item }: { item: NotesType }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteDate}>
          {new Date(item.date_created).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.noteInfo}>
        <Text style={styles.infoText}>Number Dead Fish: {item.fish_count}</Text>
        <Text style={styles.infoText}>Temp: {item.temperature}°C</Text>
      </View>

      <Text style={styles.observation}>{item.observation}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleOpenModal(item)}
        >
          <Pencil color={mainColors.background} size={20} />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Trash color={mainColors.background} size={20} />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Text style={styles.addButtonText}>+ Add Note</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notes yet. Add your first note!</Text>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'Add New Note'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter note title"
                placeholderTextColor="#999"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dead Fish Count <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter fish count"
                placeholderTextColor="#999"
                value={formData.fish_count}
                onChangeText={(text) => setFormData({ ...formData, fish_count: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Temperature (°C) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter temperature"
                placeholderTextColor="#999"
                value={formData.temperature}
                onChangeText={(text) => setFormData({ ...formData, temperature: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observation</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your observations (optional)"
                placeholderTextColor="#999"
                value={formData.observation}
                onChangeText={(text) => setFormData({ ...formData, observation: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {editingNote ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mainColors.foreground,
  },
  addButton: {
    backgroundColor: mainColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: mainColors.primaryForeground,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: mainColors.foreground,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  noteInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  observation: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: mainColors.destructive,
  },
  buttonText: {
    color: mainColors.background,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: mainColors.foreground + '90',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: mainColors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: mainColors.foreground,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: mainColors.foreground,
  },
  required: {
    color: mainColors.destructive,
  },
  input: {
    borderWidth: 1,
    borderColor: mainColors.accent,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: mainColors.foreground,
    backgroundColor: mainColors.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  submitButton: {
    backgroundColor: mainColors.primary,
  },
});