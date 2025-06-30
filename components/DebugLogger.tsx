import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  data?: any;
}

const getLogLevelStyle = (level: string) => {
  switch (level) {
    case 'error': return { backgroundColor: 'rgba(255, 0, 0, 0.2)' };
    case 'warn': return { backgroundColor: 'rgba(255, 255, 0, 0.2)' };
    case 'info': return { backgroundColor: 'rgba(0, 0, 255, 0.2)' };
    default: return { backgroundColor: 'rgba(255, 255, 255, 0.1)' };
  }
};

const DebugLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!isVisible && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsVisible(true)}
        >
          <Ionicons name="bug" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      
      {isVisible && (
        <View style={styles.logContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Debug Logs</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.logList}>
            {logs.length === 0 ? (
              <Text style={styles.noLogs}>No logs yet</Text>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={[styles.logEntry, getLogLevelStyle(log.level)]}>
                  <Text style={styles.timestamp}>
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                  <Text style={styles.level}>[{log.level.toUpperCase()}]</Text>
                  <Text style={styles.message}>{log.message}</Text>
                  {log.data && (
                    <Text style={styles.data}>{log.data}</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    zIndex: 1000,
  },
  toggleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContainer: {
    width: 350,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  logList: {
    flex: 1,
    padding: 10,
  },
  noLogs: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 50,
  },
  logEntry: {
    padding: 8,
    marginBottom: 5,
    borderRadius: 5,
  },
  timestamp: {
    color: '#ccc',
    fontSize: 10,
  },
  level: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  data: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
});

export const DebugToggle = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isVisible && <DebugLogger />}
    </View>
  );
};

export default DebugLogger;
